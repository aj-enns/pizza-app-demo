'use client';

import { ThemeProvider } from '@/contexts/ThemeContext';
import Header from './Header';
import Footer from './Footer';
import PerformanceMonitor from './PerformanceMonitor';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </div>
      <PerformanceMonitor />
    </ThemeProvider>
  );
}
