export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="text-xl text-muted-foreground mt-2">Page not found</p>
        <a href="/dashboard" className="text-primary hover:underline mt-4 block">
          Go back home
        </a>
      </div>
    </div>
  );
}
