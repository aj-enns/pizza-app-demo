const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const {
  FaUsers,
  FaBrain,
  FaGitAlt,
  FaRocket,
  FaCogs,
  FaProjectDiagram,
  FaTerminal,
  FaHammer,
  FaCode,
  FaVial,
  FaClipboardList,
  FaSyncAlt,
  FaFolderOpen,
  FaLightbulb,
  FaExclamationTriangle,
  FaClock,
  FaRandom,
} = require("react-icons/fa");

// ─── Icon Helpers ──────────────────────────────────────────────────
function renderIconSvg(IconComponent, color = "#000000", size = 256) {
  return ReactDOMServer.renderToStaticMarkup(
    React.createElement(IconComponent, { color, size: String(size) })
  );
}

async function iconToBase64Png(IconComponent, color, size = 256) {
  const svg = renderIconSvg(IconComponent, color, size);
  const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + pngBuffer.toString("base64");
}

// ─── Color Palette ─────────────────────────────────────────────────
// Dark Navy + Cyan accent — "Midnight Tech"
const C = {
  darkBg: "0F172A",       // near-black navy (title/conclusion slides)
  medBg: "1E293B",        // dark slate (content card bg on dark slides)
  lightBg: "F1F5F9",      // light slate (content slides)
  white: "FFFFFF",
  accent: "06B6D4",       // cyan-500
  accentDark: "0891B2",   // cyan-600
  accentLight: "CFFAFE",  // cyan-100
  textLight: "F8FAFC",    // near-white text on dark
  textDark: "1E293B",     // dark text on light
  textMuted: "94A3B8",    // muted gray
  cardBg: "FFFFFF",
  cardBorder: "E2E8F0",
  success: "10B981",      // green
  warning: "F59E0B",      // amber
  danger: "EF4444",       // red
};

const FONT_TITLE = "Arial Black";
const FONT_BODY = "Calibri";

// Shadow factory (fresh object each call to avoid PptxGenJS mutation bug)
const makeShadow = () => ({
  type: "outer", color: "000000", blur: 8, offset: 3, angle: 135, opacity: 0.12,
});

// ─── Slide Builders ────────────────────────────────────────────────
async function buildPresentation() {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.author = "AJ Enns";
  pres.title = "Squad — AI Agent Teams for Any Project";

  // Pre-render all icons
  const icons = {
    users: await iconToBase64Png(FaUsers, `#${C.accent}`),
    brain: await iconToBase64Png(FaBrain, `#${C.accent}`),
    git: await iconToBase64Png(FaGitAlt, `#${C.accent}`),
    rocket: await iconToBase64Png(FaRocket, `#${C.white}`),
    cogs: await iconToBase64Png(FaCogs, `#${C.accent}`),
    project: await iconToBase64Png(FaProjectDiagram, `#${C.accent}`),
    terminal: await iconToBase64Png(FaTerminal, `#${C.white}`),
    hammer: await iconToBase64Png(FaHammer, `#${C.accent}`),
    code: await iconToBase64Png(FaCode, `#${C.accent}`),
    vial: await iconToBase64Png(FaVial, `#${C.accent}`),
    clipboard: await iconToBase64Png(FaClipboardList, `#${C.accent}`),
    sync: await iconToBase64Png(FaSyncAlt, `#${C.accent}`),
    folder: await iconToBase64Png(FaFolderOpen, `#${C.accent}`),
    lightbulb: await iconToBase64Png(FaLightbulb, `#${C.warning}`),
    warning: await iconToBase64Png(FaExclamationTriangle, `#${C.danger}`),
    clock: await iconToBase64Png(FaClock, `#${C.warning}`),
    random: await iconToBase64Png(FaRandom, `#${C.danger}`),
    usersWhite: await iconToBase64Png(FaUsers, `#${C.white}`),
    brainWhite: await iconToBase64Png(FaBrain, `#${C.white}`),
    rocketAccent: await iconToBase64Png(FaRocket, `#${C.accent}`),
    cogsWhite: await iconToBase64Png(FaCogs, `#${C.white}`),
    hammerWhite: await iconToBase64Png(FaHammer, `#${C.white}`),
    codeWhite: await iconToBase64Png(FaCode, `#${C.white}`),
    vialWhite: await iconToBase64Png(FaVial, `#${C.white}`),
    clipboardWhite: await iconToBase64Png(FaClipboardList, `#${C.white}`),
    syncWhite: await iconToBase64Png(FaSyncAlt, `#${C.white}`),
    folderWhite: await iconToBase64Png(FaFolderOpen, `#${C.white}`),
    gitWhite: await iconToBase64Png(FaGitAlt, `#${C.white}`),
  };

  // ═══════════════════════════════════════════════════════════════════
  // SLIDE 1 — Title
  // ═══════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.darkBg };

    // Accent bar top
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent },
    });

    // Icon cluster (subtle, top-right area)
    s.addImage({ data: icons.usersWhite, x: 8.2, y: 0.8, w: 0.5, h: 0.5 });
    s.addImage({ data: icons.codeWhite, x: 8.9, y: 1.1, w: 0.4, h: 0.4 });
    s.addImage({ data: icons.cogsWhite, x: 8.5, y: 1.6, w: 0.35, h: 0.35 });

    // Title
    s.addText("Squad", {
      x: 0.8, y: 1.2, w: 7, h: 1.2,
      fontSize: 54, fontFace: FONT_TITLE, color: C.white, bold: true,
      margin: 0,
    });

    // Subtitle
    s.addText("AI Agent Teams for Any Project", {
      x: 0.8, y: 2.3, w: 7, h: 0.6,
      fontSize: 24, fontFace: FONT_BODY, color: C.accent,
      margin: 0,
    });

    // Tagline
    s.addText("One command. A team that grows with your code.", {
      x: 0.8, y: 3.2, w: 7, h: 0.5,
      fontSize: 16, fontFace: FONT_BODY, color: C.textMuted, italic: true,
      margin: 0,
    });

    // Presenter info
    s.addText("AJ Enns", {
      x: 0.8, y: 4.6, w: 5, h: 0.35,
      fontSize: 14, fontFace: FONT_BODY, color: C.textMuted,
      margin: 0,
    });

    // Bottom accent bar
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 5.565, w: 10, h: 0.06, fill: { color: C.accent },
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // SLIDE 2 — The Problem
  // ═══════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.lightBg };

    // Section label
    s.addText("THE PROBLEM", {
      x: 0.8, y: 0.4, w: 3, h: 0.35,
      fontSize: 11, fontFace: FONT_BODY, color: C.accent, bold: true,
      charSpacing: 4, margin: 0,
    });

    // Title
    s.addText("AI Coding Assistants Today", {
      x: 0.8, y: 0.8, w: 8, h: 0.6,
      fontSize: 30, fontFace: FONT_TITLE, color: C.textDark, bold: true,
      margin: 0,
    });

    // Pain point cards — 3 across
    const painPoints = [
      {
        icon: icons.random,
        title: "No Continuity",
        desc: "Every session starts from zero. No memory of your architecture, conventions, or past decisions.",
      },
      {
        icon: icons.clock,
        title: "Single-Threaded",
        desc: "One assistant, one task at a time. No parallelism. You are the bottleneck and the router.",
      },
      {
        icon: icons.warning,
        title: "No Specialization",
        desc: "One model does everything — frontend, backend, testing, docs. No role expertise or separation of concerns.",
      },
    ];

    const cardW = 2.7;
    const gap = 0.25;
    const startX = 0.8;

    painPoints.forEach((p, i) => {
      const cx = startX + i * (cardW + gap);

      // Card background
      s.addShape(pres.shapes.RECTANGLE, {
        x: cx, y: 1.7, w: cardW, h: 3.0,
        fill: { color: C.cardBg },
        shadow: makeShadow(),
      });

      // Left accent bar
      s.addShape(pres.shapes.RECTANGLE, {
        x: cx, y: 1.7, w: 0.06, h: 3.0,
        fill: { color: C.danger },
      });

      // Icon
      s.addImage({ data: p.icon, x: cx + 0.35, y: 2.0, w: 0.45, h: 0.45 });

      // Pain point title
      s.addText(p.title, {
        x: cx + 0.25, y: 2.6, w: cardW - 0.5, h: 0.4,
        fontSize: 16, fontFace: FONT_BODY, color: C.textDark, bold: true,
        margin: 0,
      });

      // Description
      s.addText(p.desc, {
        x: cx + 0.25, y: 3.05, w: cardW - 0.5, h: 1.4,
        fontSize: 12, fontFace: FONT_BODY, color: C.textMuted,
        margin: 0, valign: "top",
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // SLIDE 3 — What is Squad?
  // ═══════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.darkBg };

    // Section label
    s.addText("THE SOLUTION", {
      x: 0.8, y: 0.4, w: 3, h: 0.35,
      fontSize: 11, fontFace: FONT_BODY, color: C.accent, bold: true,
      charSpacing: 4, margin: 0,
    });

    // Title
    s.addText("What is Squad?", {
      x: 0.8, y: 0.8, w: 8, h: 0.6,
      fontSize: 30, fontFace: FONT_TITLE, color: C.white, bold: true,
      margin: 0,
    });

    // Big value prop
    s.addText(
      "Squad gives you an AI development team through GitHub Copilot. " +
      "Describe what you're building. Get a team of specialists that live " +
      "in your repo as files.",
      {
        x: 0.8, y: 1.7, w: 8.4, h: 0.9,
        fontSize: 16, fontFace: FONT_BODY, color: C.textLight,
        margin: 0, valign: "top",
      }
    );

    // Key differentiators — 2x2 grid
    const diffs = [
      { icon: icons.brain, title: "Persistent Memory", desc: "Agents learn your codebase across sessions" },
      { icon: icons.project, title: "Parallel Execution", desc: "Multiple agents work simultaneously" },
      { icon: icons.git, title: "Lives in Git", desc: "Team state is committed — anyone who clones gets the team" },
      { icon: icons.cogs, title: "Specialized Roles", desc: "Lead, frontend, backend, tester — each with their own expertise" },
    ];

    const gridStartY = 2.9;
    const cellW = 4.0;
    const cellH = 1.15;
    const gapX = 0.4;
    const gapY = 0.25;

    diffs.forEach((d, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const cx = 0.8 + col * (cellW + gapX);
      const cy = gridStartY + row * (cellH + gapY);

      // Card bg
      s.addShape(pres.shapes.RECTANGLE, {
        x: cx, y: cy, w: cellW, h: cellH,
        fill: { color: C.medBg },
      });

      // Icon
      s.addImage({ data: d.icon, x: cx + 0.25, y: cy + 0.3, w: 0.45, h: 0.45 });

      // Title
      s.addText(d.title, {
        x: cx + 0.9, y: cy + 0.15, w: cellW - 1.2, h: 0.35,
        fontSize: 14, fontFace: FONT_BODY, color: C.white, bold: true,
        margin: 0,
      });

      // Desc
      s.addText(d.desc, {
        x: cx + 0.9, y: cy + 0.55, w: cellW - 1.2, h: 0.4,
        fontSize: 12, fontFace: FONT_BODY, color: C.textMuted,
        margin: 0,
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // SLIDE 4 — How It Works
  // ═══════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.lightBg };

    // Section label
    s.addText("ARCHITECTURE", {
      x: 0.8, y: 0.4, w: 3, h: 0.35,
      fontSize: 11, fontFace: FONT_BODY, color: C.accent, bold: true,
      charSpacing: 4, margin: 0,
    });

    s.addText("How It Works", {
      x: 0.8, y: 0.8, w: 8, h: 0.6,
      fontSize: 30, fontFace: FONT_TITLE, color: C.textDark, bold: true,
      margin: 0,
    });

    // Flow: User → Coordinator → Agents (fan-out) → Results
    // Step 1: You
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: 2.2, w: 1.6, h: 1.4,
      fill: { color: C.accent },
      shadow: makeShadow(),
    });
    s.addText([
      { text: "You", options: { fontSize: 16, bold: true, color: C.white, breakLine: true } },
      { text: '"Build the\nlogin page"', options: { fontSize: 11, color: C.accentLight, italic: true } },
    ], { x: 0.5, y: 2.3, w: 1.6, h: 1.2, fontFace: FONT_BODY, align: "center", valign: "middle", margin: 0 });

    // Arrow 1
    s.addText("→", { x: 2.15, y: 2.6, w: 0.5, h: 0.5, fontSize: 28, color: C.accent, align: "center", fontFace: FONT_BODY, margin: 0 });

    // Step 2: Coordinator
    s.addShape(pres.shapes.RECTANGLE, {
      x: 2.7, y: 1.9, w: 2.0, h: 2.0,
      fill: { color: C.darkBg },
      shadow: makeShadow(),
    });
    s.addImage({ data: icons.rocketAccent, x: 3.45, y: 2.1, w: 0.5, h: 0.5 });
    s.addText([
      { text: "Coordinator", options: { fontSize: 14, bold: true, color: C.white, breakLine: true } },
      { text: "Routes work\nChooses agents\nManages handoffs", options: { fontSize: 10, color: C.textMuted } },
    ], { x: 2.7, y: 2.7, w: 2.0, h: 1.1, fontFace: FONT_BODY, align: "center", margin: 0 });

    // Arrow 2 (fan-out)
    s.addText("→", { x: 4.75, y: 2.6, w: 0.5, h: 0.5, fontSize: 28, color: C.accent, align: "center", fontFace: FONT_BODY, margin: 0 });

    // Step 3: Agents (stacked)
    const agents = [
      { emoji: "🏗️", name: "Lead", color: C.accentDark },
      { emoji: "⚛️", name: "Frontend", color: C.accent },
      { emoji: "🔧", name: "Backend", color: C.accentDark },
      { emoji: "🧪", name: "Tester", color: C.accent },
    ];

    const agentStartY = 1.55;
    const agentH = 0.72;
    const agentGap = 0.12;

    agents.forEach((a, i) => {
      const ay = agentStartY + i * (agentH + agentGap);
      s.addShape(pres.shapes.RECTANGLE, {
        x: 5.3, y: ay, w: 2.2, h: agentH,
        fill: { color: C.cardBg },
        shadow: makeShadow(),
      });
      // Accent left bar
      s.addShape(pres.shapes.RECTANGLE, {
        x: 5.3, y: ay, w: 0.06, h: agentH,
        fill: { color: a.color },
      });
      s.addText(`${a.emoji}  ${a.name}`, {
        x: 5.5, y: ay, w: 1.9, h: agentH,
        fontSize: 13, fontFace: FONT_BODY, color: C.textDark, bold: true,
        valign: "middle", margin: 0,
      });
    });

    // Arrow 3
    s.addText("→", { x: 7.55, y: 2.6, w: 0.5, h: 0.5, fontSize: 28, color: C.accent, align: "center", fontFace: FONT_BODY, margin: 0 });

    // Step 4: Results
    s.addShape(pres.shapes.RECTANGLE, {
      x: 8.1, y: 2.0, w: 1.6, h: 1.8,
      fill: { color: C.darkBg },
      shadow: makeShadow(),
    });
    s.addImage({ data: icons.gitWhite, x: 8.65, y: 2.15, w: 0.4, h: 0.4 });
    s.addText([
      { text: "Results", options: { fontSize: 14, bold: true, color: C.white, breakLine: true } },
      { text: "Code written\nTests passing\nDecisions logged\nAll in git", options: { fontSize: 10, color: C.textMuted } },
    ], { x: 8.1, y: 2.6, w: 1.6, h: 1.1, fontFace: FONT_BODY, align: "center", margin: 0 });

    // "All in parallel" callout
    s.addShape(pres.shapes.RECTANGLE, {
      x: 5.3, y: 4.95, w: 2.2, h: 0.35,
      fill: { color: C.accent },
    });
    s.addText("⚡ All in parallel", {
      x: 5.3, y: 4.95, w: 2.2, h: 0.35,
      fontSize: 11, fontFace: FONT_BODY, color: C.white, bold: true,
      align: "center", valign: "middle", margin: 0,
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // SLIDE 5 — Meet the Team
  // ═══════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.darkBg };

    s.addText("TEAM ROLES", {
      x: 0.8, y: 0.4, w: 3, h: 0.35,
      fontSize: 11, fontFace: FONT_BODY, color: C.accent, bold: true,
      charSpacing: 4, margin: 0,
    });

    s.addText("Anatomy of a Squad", {
      x: 0.8, y: 0.8, w: 8, h: 0.6,
      fontSize: 30, fontFace: FONT_TITLE, color: C.white, bold: true,
      margin: 0,
    });

    // 2x3 grid of team roles
    const roles = [
      { emoji: "🏗️", name: "Lead", desc: "Architecture, code review,\ntriage, decisions", icon: icons.hammerWhite },
      { emoji: "⚛️", name: "Frontend Dev", desc: "React, UI, components,\nclient-side logic", icon: icons.codeWhite },
      { emoji: "🔧", name: "Backend Dev", desc: "APIs, database, server,\ndata models", icon: icons.cogsWhite },
      { emoji: "🧪", name: "Tester", desc: "Unit & E2E tests, quality,\nedge cases", icon: icons.vialWhite },
      { emoji: "📋", name: "Scribe", desc: "Silent memory manager,\nlogs & decisions", icon: icons.clipboardWhite },
      { emoji: "🔄", name: "Ralph", desc: "Work monitor, backlog,\nautonomous polling", icon: icons.syncWhite },
    ];

    const rCardW = 2.7;
    const rCardH = 1.3;
    const rGapX = 0.3;
    const rGapY = 0.25;
    const rStartX = 0.8;
    const rStartY = 1.65;

    roles.forEach((r, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const rx = rStartX + col * (rCardW + rGapX);
      const ry = rStartY + row * (rCardH + rGapY);

      // Card
      s.addShape(pres.shapes.RECTANGLE, {
        x: rx, y: ry, w: rCardW, h: rCardH,
        fill: { color: C.medBg },
      });

      // Accent top bar
      s.addShape(pres.shapes.RECTANGLE, {
        x: rx, y: ry, w: rCardW, h: 0.05,
        fill: { color: C.accent },
      });

      // Emoji + Name
      s.addText(`${r.emoji}  ${r.name}`, {
        x: rx + 0.2, y: ry + 0.15, w: rCardW - 0.4, h: 0.35,
        fontSize: 15, fontFace: FONT_BODY, color: C.white, bold: true,
        margin: 0,
      });

      // Description
      s.addText(r.desc, {
        x: rx + 0.2, y: ry + 0.55, w: rCardW - 0.4, h: 0.65,
        fontSize: 11, fontFace: FONT_BODY, color: C.textMuted,
        margin: 0, valign: "top",
      });
    });

    // Callout at bottom
    s.addText("Names are cast from a single fictional universe — persistent across sessions", {
      x: 0.8, y: 4.85, w: 8.4, h: 0.4,
      fontSize: 12, fontFace: FONT_BODY, color: C.textMuted, italic: true,
      margin: 0,
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // SLIDE 6 — What Lives in Your Repo
  // ═══════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.lightBg };

    s.addText("FILE STRUCTURE", {
      x: 0.8, y: 0.4, w: 3, h: 0.35,
      fontSize: 11, fontFace: FONT_BODY, color: C.accent, bold: true,
      charSpacing: 4, margin: 0,
    });

    s.addText("What Lives in Your Repo", {
      x: 0.8, y: 0.8, w: 8, h: 0.6,
      fontSize: 30, fontFace: FONT_TITLE, color: C.textDark, bold: true,
      margin: 0,
    });

    // Left side — directory tree
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.6, y: 1.6, w: 4.2, h: 3.6,
      fill: { color: C.darkBg },
      shadow: makeShadow(),
    });

    const treeLines = [
      { text: ".squad/", indent: 0, bold: true },
      { text: "├── team.md", indent: 1, note: "roster" },
      { text: "├── routing.md", indent: 1, note: "who handles what" },
      { text: "├── decisions.md", indent: 1, note: "shared brain" },
      { text: "├── ceremonies.md", indent: 1, note: "sprint rituals" },
      { text: "├── agents/", indent: 1, bold: true },
      { text: "│   └── {name}/", indent: 2 },
      { text: "│       ├── charter.md", indent: 2, note: "identity" },
      { text: "│       └── history.md", indent: 2, note: "learnings" },
      { text: "├── skills/", indent: 1, note: "reusable patterns" },
      { text: "├── casting/", indent: 1, note: "name registry" },
      { text: "└── log/", indent: 1, note: "session archive" },
    ];

    const treeTextParts = treeLines.map((line, i) => {
      const indent = "    ".repeat(line.indent);
      const mainText = `${indent}${line.text}`;
      const noteText = line.note ? `  # ${line.note}` : "";
      return [
        { text: mainText, options: { color: line.bold ? C.accent : C.textLight, bold: !!line.bold, fontSize: 11, fontFace: "Consolas", breakLine: !noteText && i < treeLines.length - 1  } },
        ...(noteText ? [{ text: noteText, options: { color: C.textMuted, fontSize: 10, fontFace: "Consolas", italic: true, breakLine: i < treeLines.length - 1 } }] : []),
      ];
    }).flat();

    s.addText(treeTextParts, {
      x: 0.8, y: 1.75, w: 3.8, h: 3.3,
      valign: "top", margin: 0,
    });

    // Right side — key callouts
    const callouts = [
      {
        icon: icons.git,
        title: "Committed to Git",
        desc: "Anyone who clones your repo gets the team — with all their accumulated knowledge.",
      },
      {
        icon: icons.brain,
        title: "Knowledge Compounds",
        desc: "Every session, agents write learnings to history.md. They stop asking questions they've already answered.",
      },
      {
        icon: icons.folder,
        title: "Append-Only State",
        desc: "Decisions and logs are append-only. Merge-safe across branches via union merge driver.",
      },
    ];

    callouts.forEach((c, i) => {
      const cy = 1.6 + i * 1.2;

      s.addShape(pres.shapes.RECTANGLE, {
        x: 5.2, y: cy, w: 4.3, h: 1.05,
        fill: { color: C.cardBg },
        shadow: makeShadow(),
      });

      s.addShape(pres.shapes.RECTANGLE, {
        x: 5.2, y: cy, w: 0.06, h: 1.05,
        fill: { color: C.accent },
      });

      s.addImage({ data: c.icon, x: 5.45, y: cy + 0.25, w: 0.4, h: 0.4 });

      s.addText(c.title, {
        x: 6.0, y: cy + 0.1, w: 3.3, h: 0.35,
        fontSize: 14, fontFace: FONT_BODY, color: C.textDark, bold: true,
        margin: 0,
      });

      s.addText(c.desc, {
        x: 6.0, y: cy + 0.45, w: 3.3, h: 0.5,
        fontSize: 11, fontFace: FONT_BODY, color: C.textMuted,
        margin: 0, valign: "top",
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // SLIDE 7 — Getting Started
  // ═══════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.lightBg };

    s.addText("QUICK START", {
      x: 0.8, y: 0.4, w: 3, h: 0.35,
      fontSize: 11, fontFace: FONT_BODY, color: C.accent, bold: true,
      charSpacing: 4, margin: 0,
    });

    s.addText("Getting Started", {
      x: 0.8, y: 0.8, w: 8, h: 0.6,
      fontSize: 30, fontFace: FONT_TITLE, color: C.textDark, bold: true,
      margin: 0,
    });

    // 3 steps — large numbered cards
    const steps = [
      {
        num: "1",
        title: "Install",
        code: "npm install -g @bradygaster/squad-cli\nsquad init",
        desc: "Scaffolds .squad/ directory with team.md, routing, templates",
      },
      {
        num: "2",
        title: "Open Copilot",
        code: 'copilot --agent squad --yolo',
        desc: "Use GitHub Copilot CLI or VS Code Chat with Squad agent selected",
      },
      {
        num: "3",
        title: "Describe & Go",
        code: '"Set up the team. I\'m building\na pizza ordering app with\nNext.js and TypeScript."',
        desc: "Squad proposes a team. Say yes. They're ready to work.",
      },
    ];

    steps.forEach((step, i) => {
      const sx = 0.6 + i * 3.1;
      const cardW = 2.85;

      // Card
      s.addShape(pres.shapes.RECTANGLE, {
        x: sx, y: 1.65, w: cardW, h: 3.5,
        fill: { color: C.cardBg },
        shadow: makeShadow(),
      });

      // Accent top bar
      s.addShape(pres.shapes.RECTANGLE, {
        x: sx, y: 1.65, w: cardW, h: 0.06,
        fill: { color: C.accent },
      });

      // Step number circle
      s.addShape(pres.shapes.OVAL, {
        x: sx + 0.25, y: 1.9, w: 0.55, h: 0.55,
        fill: { color: C.accent },
      });
      s.addText(step.num, {
        x: sx + 0.25, y: 1.9, w: 0.55, h: 0.55,
        fontSize: 22, fontFace: FONT_TITLE, color: C.white, bold: true,
        align: "center", valign: "middle", margin: 0,
      });

      // Step title
      s.addText(step.title, {
        x: sx + 0.95, y: 1.95, w: cardW - 1.2, h: 0.4,
        fontSize: 18, fontFace: FONT_BODY, color: C.textDark, bold: true,
        margin: 0, valign: "middle",
      });

      // Code block
      s.addShape(pres.shapes.RECTANGLE, {
        x: sx + 0.2, y: 2.7, w: cardW - 0.4, h: 1.3,
        fill: { color: C.darkBg },
      });
      s.addText(step.code, {
        x: sx + 0.35, y: 2.8, w: cardW - 0.7, h: 1.1,
        fontSize: 10, fontFace: "Consolas", color: C.accent,
        margin: 0, valign: "top",
      });

      // Description
      s.addText(step.desc, {
        x: sx + 0.25, y: 4.2, w: cardW - 0.5, h: 0.8,
        fontSize: 11, fontFace: FONT_BODY, color: C.textMuted,
        margin: 0, valign: "top",
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // SLIDE 8 — Demo Time
  // ═══════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.darkBg };

    // Accent bar top
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent },
    });

    // Terminal icon
    s.addImage({ data: icons.terminal, x: 4.5, y: 1.3, w: 1.0, h: 1.0 });

    // Title
    s.addText("Demo Time", {
      x: 1, y: 2.5, w: 8, h: 0.9,
      fontSize: 48, fontFace: FONT_TITLE, color: C.white, bold: true,
      align: "center", margin: 0,
    });

    // Subtitle
    s.addText("Let's see Squad in action on a real project", {
      x: 1, y: 3.4, w: 8, h: 0.5,
      fontSize: 18, fontFace: FONT_BODY, color: C.accent,
      align: "center", margin: 0,
    });

    // What we'll demo
    s.addText([
      { text: "Setting up a team  •  Routing work to agents  •  Parallel execution  •  Persistent memory", options: { fontSize: 13, color: C.textMuted } },
    ], {
      x: 1, y: 4.2, w: 8, h: 0.4,
      fontFace: FONT_BODY, align: "center", margin: 0,
    });

    // Bottom accent bar
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 5.565, w: 10, h: 0.06, fill: { color: C.accent },
    });
  }

  // ─── Write File ──────────────────────────────────────────────────
  await pres.writeFile({ fileName: "Squad-Presentation.pptx" });
  console.log("✅ Squad-Presentation.pptx created successfully!");
}

buildPresentation().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
