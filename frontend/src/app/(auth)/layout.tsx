'use client';

import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-primary/5">
      <div className="container relative flex-col justify-center items-center flex min-h-screen p-4">
        <div className="absolute top-4 left-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-8 w-8 text-primary"
            >
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
            EnglishPro
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
