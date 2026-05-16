import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          English Learning Platform
        </h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          Master English with flashcards, quizzes, and speaking practice
        </p>
        <div className="mt-10 flex gap-4 justify-center">
          <Link
            href="/login"
            className="rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="rounded-md bg-secondary px-6 py-3 text-sm font-semibold text-secondary-foreground shadow-sm hover:bg-secondary/80"
          >
            Get Started
          </Link>
        </div>
      </div>
    </main>
  );
}
