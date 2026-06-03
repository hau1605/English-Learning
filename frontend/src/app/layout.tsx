import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import { Toaster } from 'sonner';
import './globals.css';
import { AuthProvider } from '@/app/auth-provider';
import { Providers } from '@/app/providers';
import { ThemeProvider } from '@/components/theme-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'English Learning Platform',
  description: 'Learn English with flashcards, quizzes, and speaking practice',
};

const themeScript = `
  (function() {
    try {
      var stored = localStorage.getItem('theme-storage');
      if (stored) {
        var data = JSON.parse(stored).state;
        if (data && data.theme) {
          var resolved = data.theme === 'system'
            ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
            : data.theme;
          if (resolved === 'dark') {
            document.documentElement.classList.add('dark');
          }
        }
      }
    } catch (e) {}
  })();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Script id="theme-script" strategy="beforeInteractive">
          {themeScript}
        </Script>
        <ThemeProvider>
          <Providers>
            <AuthProvider>
              {children}
              <Toaster position="top-right" richColors />
            </AuthProvider>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
