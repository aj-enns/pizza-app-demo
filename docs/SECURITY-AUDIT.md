# Security Audit Report
**Date:** November 17, 2025  
**Application:** Pizza Ordering Website  
**Auditor:** Security Analysis

---

## Executive Summary

This security audit identified **11 security vulnerabilities** ranging from **CRITICAL** to **LOW** severity. The application has **good security practices** in several areas (input sanitization, price recalculation, XSS prevention) but has **critical issues** that must be addressed before production deployment.

### Risk Summary
- 🔴 **CRITICAL**: 2 issues
- 🟠 **HIGH**: 3 issues  
- 🟡 **MEDIUM**: 4 issues
- 🟢 **LOW**: 2 issues

---

## Critical Vulnerabilities (🔴 Priority 1)

### 1. Path Traversal Vulnerability in Order Retrieval
**Severity:** CRITICAL  
**File:** `app/api/orders/[id]/route.ts`  
**Lines:** 17-19

**Issue:**
```typescript
const { id } = params;
const orderFilePath = path.join(DATA_DIR, `${id}.json`);
```

The `id` parameter is **not validated** before being used in file path construction. An attacker could use path traversal sequences to read arbitrary files.

**Attack Example:**
```bash
GET /api/orders/../../../../../../etc/passwd
GET /api/orders/../../../app/api/orders/route.ts
GET /api/orders/..%2F..%2F..%2Fpackage.json
```

**Impact:**
- Read sensitive application files
- Read system files (if permissions allow)
- Information disclosure of source code
- Potential credential exposure

**Recommendation:**
```typescript
// Add strict validation
function validateOrderId(id: string): boolean {
  // Only allow alphanumeric, hyphens, and "order-" prefix
  return /^order-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(id);
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return trackPerformance(
    'API:GET:/api/orders/[id]',
    async () => {
      try {
        const { id } = params;
        
        // VALIDATE BEFORE USE
        if (!validateOrderId(id)) {
          return NextResponse.json(
            { success: false, error: 'Invalid order ID' },
            { status: 400 }
          );
        }
        
        const orderFilePath = path.join(DATA_DIR, `${id}.json`);
        // Rest of code...
```

---

### 2. No Rate Limiting on Order Creation
**Severity:** CRITICAL  
**File:** `app/api/orders/route.ts`  
**Lines:** 129-219

**Issue:**
No rate limiting or throttling on the POST endpoint. An attacker can:
- Create unlimited orders (resource exhaustion)
- Fill disk space with order JSON files
- DDoS the application
- Spam victims with delivery information

**Attack Example:**
```javascript
// Automated attack script
for (let i = 0; i < 100000; i++) {
  fetch('/api/orders', {
    method: 'POST',
    body: JSON.stringify({ customerInfo: {...}, items: [...] })
  });
}
```

**Impact:**
- Disk space exhaustion
- Server crash
- Denial of Service
- Database/filesystem corruption

**Recommendation:**
Implement rate limiting using middleware or library:

```typescript
// Option 1: Use upstash/ratelimit or express-rate-limit
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 requests per minute
});

export async function POST(request: NextRequest) {
  // Get IP address
  const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? 'anonymous';
  
  // Check rate limit
  const { success, limit, remaining } = await ratelimit.limit(ip);
  
  if (!success) {
    return NextResponse.json(
      { success: false, error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'X-RateLimit-Limit': limit.toString() } }
    );
  }
  
  // Continue with order creation...
}

// Option 2: Simple in-memory rate limiting (development)
const requestCounts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(ip);
  
  if (!record || now > record.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + 60000 });
    return true;
  }
  
  if (record.count >= 5) {
    return false; // Exceeded limit
  }
  
  record.count++;
  return true;
}
```

---

## High Severity Vulnerabilities (🟠 Priority 2)

### 3. Weak Input Sanitization (Incomplete XSS Protection)
**Severity:** HIGH  
**File:** `app/api/orders/route.ts`  
**Lines:** 57

**Issue:**
```typescript
const sanitize = (str: string) => str.trim().replace(/[<>]/g, '');
```

This sanitization is **incomplete**. It only removes `<` and `>`, but doesn't handle:
- JavaScript event handlers: `onerror`, `onload`
- HTML entities: `&lt;`, `&gt;`
- Unicode encoding bypasses
- SQL injection attempts
- Script tags in different formats

**Attack Examples:**
```javascript
// Bypass examples:
name: "John&lt;script&gt;alert(1)&lt;/script&gt;" // HTML entity encoding
address: "123 Main' OR '1'='1" // SQL injection (if moved to DB)
deliveryInstructions: "Call me\" onclick=\"alert(1)\" dummy=\"" // Event injection
```

**Impact:**
- Stored XSS if data displayed without escaping
- Potential injection if migrated to SQL database
- Data corruption

**Recommendation:**
Use a proper sanitization library:

```typescript
import DOMPurify from 'isomorphic-dompurify';
// OR
import validator from 'validator';

const sanitize = (str: string): string => {
  // Option 1: DOMPurify (best for HTML)
  return DOMPurify.sanitize(str, { 
    ALLOWED_TAGS: [], // Strip all HTML
    ALLOWED_ATTR: [] 
  });
  
  // Option 2: Validator.js
  return validator.escape(validator.trim(str));
};

// Also add length limits consistently
if (deliveryInstructions && deliveryInstructions.length > MAX_STRING_LENGTH) {
  return { valid: false, error: 'Delivery instructions too long' };
}
```

---

### 4. Insecure File Storage Without Encryption
**Severity:** HIGH  
**File:** `app/api/orders/route.ts`  
**Lines:** 189-195

**Issue:**
Order data containing **PII** (Personally Identifiable Information) is stored in **plaintext JSON files**:
- Customer names
- Email addresses
- Phone numbers
- Home addresses

**Impact:**
- **GDPR/Privacy violations**
- Data breach if server compromised
- Easy to scrape customer data
- No encryption at rest

**Recommendation:**

```typescript
import crypto from 'crypto';

// Use encryption for sensitive data
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32-byte key
const ALGORITHM = 'aes-256-gcm';

function encrypt(text: string): { encrypted: string; iv: string; tag: string } {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex')
  };
}

function decrypt(encrypted: string, iv: string, tag: string): string {
  const decipher = crypto.createDecipheriv(
    ALGORITHM, 
    Buffer.from(ENCRYPTION_KEY, 'hex'), 
    Buffer.from(iv, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(tag, 'hex'));
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// When saving order
const encryptedData = encrypt(JSON.stringify(order));
await writeFile(orderFilePath, JSON.stringify(encryptedData));

// When reading order
const encryptedData = JSON.parse(await readFile(orderFilePath, 'utf-8'));
const orderData = decrypt(encryptedData.encrypted, encryptedData.iv, encryptedData.tag);
const order = JSON.parse(orderData);
```

**BETTER:** Migrate to a database with encryption at rest (PostgreSQL with pgcrypto, MongoDB with field-level encryption).

---

### 5. No Authentication/Authorization
**Severity:** HIGH  
**File:** `app/api/orders/[id]/route.ts`  
**Lines:** All

**Issue:**
**Anyone** can retrieve **any order** if they know/guess the order ID. No authentication required.

**Attack Example:**
```javascript
// Brute force order IDs
for (let i = 0; i < 100000; i++) {
  const response = await fetch(`/api/orders/order-${uuid.v4()}`);
  if (response.ok) {
    const order = await response.json();
    console.log('Found order:', order.data.customerInfo);
  }
}
```

**Impact:**
- Unauthorized access to customer PII
- Privacy violation
- GDPR/CCPA compliance issue

**Recommendation:**

```typescript
// Option 1: Add session-based auth
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Check authentication
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  // Check authorization (order belongs to user)
  const order = await getOrder(params.id);
  if (order.customerInfo.email !== session.user.email && !session.user.isAdmin) {
    return NextResponse.json(
      { success: false, error: 'Forbidden' },
      { status: 403 }
    );
  }
  
  // Return order...
}

// Option 2: Use secure tokens instead of order IDs
// Generate a secure token for each order
const accessToken = crypto.randomBytes(32).toString('hex');
// Store token with order
// Share token with customer instead of order ID
```

---

## Medium Severity Vulnerabilities (🟡 Priority 3)

### 6. No CORS Configuration
**Severity:** MEDIUM  
**File:** All API routes

**Issue:**
No CORS (Cross-Origin Resource Sharing) headers are set. This could allow:
- Cross-site request forgery (CSRF)
- Unauthorized API access from other domains
- Data theft via malicious websites

**Impact:**
- CSRF attacks
- API abuse from other domains

**Recommendation:**

```typescript
// middleware.ts (create this file)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin');
  const allowedOrigins = [
    'https://yourdomain.com',
    'https://www.yourdomain.com',
    process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null
  ].filter(Boolean);
  
  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : 'null',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }
  
  const response = NextResponse.next();
  
  if (allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }
  
  return response;
}

export const config = {
  matcher: '/api/:path*',
};
```

---

### 7. No CSRF Protection
**Severity:** MEDIUM  
**File:** `app/api/orders/route.ts`

**Issue:**
POST endpoint has no CSRF token validation. An attacker could create a malicious website that submits orders on behalf of users.

**Attack Example:**
```html
<!-- attacker.com/evil.html -->
<form id="evil" action="https://victim-pizza-site.com/api/orders" method="POST">
  <input name="customerInfo[name]" value="Victim">
  <input name="customerInfo[email]" value="victim@example.com">
  <!-- ... -->
</form>
<script>
  document.getElementById('evil').submit(); // Auto-submit
</script>
```

**Impact:**
- Unauthorized order creation
- Spam/harassment
- Resource exhaustion

**Recommendation:**

```typescript
// Use next-auth or implement CSRF tokens
import { getToken } from 'next-auth/jwt';

export async function POST(request: NextRequest) {
  // Verify CSRF token
  const csrfToken = request.headers.get('x-csrf-token');
  const validToken = await verifyCsrfToken(csrfToken, request);
  
  if (!validToken) {
    return NextResponse.json(
      { success: false, error: 'Invalid CSRF token' },
      { status: 403 }
    );
  }
  
  // Continue...
}

// Generate CSRF token endpoint
export async function GET(request: NextRequest) {
  const token = await generateCsrfToken(request);
  return NextResponse.json({ csrfToken: token });
}
```

---

### 8. Sensitive Data Exposure in Error Messages
**Severity:** MEDIUM  
**File:** `app/api/orders/route.ts`  
**Lines:** 215, 227-233

**Issue:**
```typescript
console.error('Order creation error:', error instanceof Error ? error.message : 'Unknown error');
```

Error messages might expose sensitive information:
- File paths
- Internal logic
- Stack traces (in development)

**Impact:**
- Information disclosure
- Helps attackers understand system

**Recommendation:**

```typescript
// Log detailed errors server-side only
if (process.env.NODE_ENV === 'development') {
  console.error('Order creation error [DETAILED]:', error);
} else {
  // Production: log to secure logging service
  logger.error('Order creation failed', { 
    errorId: generateErrorId(),
    timestamp: new Date().toISOString()
    // DO NOT log error details to console
  });
}

// Return generic error to client
return NextResponse.json(
  {
    success: false,
    error: 'Failed to create order',
    errorId: errorId // For customer support reference
  },
  { status: 500 }
);
```

---

### 9. Missing Security Headers
**Severity:** MEDIUM  
**File:** Global configuration

**Issue:**
Missing critical security headers:
- `Content-Security-Policy`
- `X-Frame-Options`
- `X-Content-Type-Options`
- `Strict-Transport-Security`
- `Referrer-Policy`

**Impact:**
- Clickjacking attacks
- XSS attacks
- MIME sniffing
- Man-in-the-middle attacks

**Recommendation:**

```javascript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self';"
  }
];

const nextConfig = {
  output: 'standalone',
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

module.exports = nextConfig;
```

---

## Low Severity Vulnerabilities (🟢 Priority 4)

### 10. Wildcard Image Hostname Configuration
**Severity:** LOW  
**File:** `next.config.js`  
**Lines:** 4-8

**Issue:**
```javascript
remotePatterns: [
  {
    protocol: 'https',
    hostname: '**', // Allows ANY domain
  },
],
```

Allows loading images from **any external domain**, which could:
- Load malicious images
- Track users via image pixels
- Hotlink abuse

**Recommendation:**

```javascript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'images.unsplash.com', // Specific domain only
    },
    {
      protocol: 'https',
      hostname: 'yourimagecdн.com',
    },
  ],
},
```

---

### 11. No Input Length Validation on All Fields
**Severity:** LOW  
**File:** `app/api/orders/route.ts`  
**Lines:** 38-40

**Issue:**
Only `name` and `address` are checked for length. Other fields (`email`, `phone`, `city`, `zipCode`) have no length limits.

**Impact:**
- Potential buffer overflows (unlikely in JS)
- Database errors if migrated
- Storage waste

**Recommendation:**

```typescript
// Add comprehensive validation
const MAX_EMAIL_LENGTH = 254; // RFC 5321
const MAX_PHONE_LENGTH = 20;
const MAX_CITY_LENGTH = 100;
const MAX_ZIPCODE_LENGTH = 20;

if (email.length > MAX_EMAIL_LENGTH || 
    phone.length > MAX_PHONE_LENGTH ||
    city.length > MAX_CITY_LENGTH ||
    zipCode.length > MAX_ZIPCODE_LENGTH) {
  return { valid: false, error: 'Input field exceeds maximum length' };
}
```

---

## Good Security Practices Found ✅

1. **Server-side price recalculation** - Prevents price manipulation
2. **XSS sanitization** (partial) - Removes `<>` characters
3. **Input validation** - Checks required fields, formats
4. **UUIDs for order IDs** - Hard to guess (but needs validation)
5. **Non-root Docker user** - Reduces container escape risk
6. **No hardcoded secrets** - Uses environment variables
7. **JSON error handling** - Catches syntax errors
8. **Cart size limits** - Prevents abuse (MAX_ITEMS = 50)
9. **Quantity validation** - Prevents negative quantities

---

## Compliance Issues

### GDPR Violations
1. ❌ No encryption of personal data at rest
2. ❌ No data access controls
3. ❌ No audit logging of data access
4. ❌ No data retention policy
5. ❌ No "right to be forgotten" implementation

### PCI DSS (if accepting payments)
⚠️ **Do NOT add payment processing** without:
- PCI DSS compliance
- PCI-certified payment gateway
- No storage of card data

---

## Recommended Immediate Actions

### Before Production Deployment:
1. ✅ **Fix path traversal** (CRITICAL)
2. ✅ **Implement rate limiting** (CRITICAL)
3. ✅ **Add authentication** (HIGH)
4. ✅ **Encrypt customer data** (HIGH)
5. ✅ **Add CORS policy** (MEDIUM)
6. ✅ **Add CSRF protection** (MEDIUM)
7. ✅ **Configure security headers** (MEDIUM)
8. ✅ **Improve input sanitization** (HIGH)

### Long-term Improvements:
- Migrate from JSON file storage to database
- Implement proper session management
- Add audit logging
- Implement data retention policies
- Add monitoring and alerting
- Conduct penetration testing
- Implement WAF (Web Application Firewall)

---

## Testing Commands

### Test Path Traversal:
```bash
curl "http://localhost:3000/api/orders/../../../../../../etc/passwd"
curl "http://localhost:3000/api/orders/../../../package.json"
```

### Test Rate Limiting:
```bash
for i in {1..100}; do
  curl -X POST http://localhost:3000/api/orders \
    -H "Content-Type: application/json" \
    -d '{"customerInfo":{...},"items":[...]}' &
done
```

### Test XSS:
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerInfo": {
      "name": "<script>alert(1)</script>",
      "email": "test@test.com",
      ...
    },
    "items": [...]
  }'
```

---

## Risk Score

**Current Security Score: 4.5/10** (Needs Improvement)

**After fixing CRITICAL & HIGH issues: 7.5/10** (Acceptable for production)

**With all recommendations: 9/10** (Production-ready)

---

## Contact Security Team

For questions about this audit, contact your security team or DevSecOps lead.

**Audit Complete**
