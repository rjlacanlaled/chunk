import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4">
      <img src="/chunk-tools/chunky-avatar-thinking.svg" alt="Chunky" className="size-20" />
      <div className="text-center">
        <h1 className="text-2xl font-bold">Page not found</h1>
        <p className="mt-2 text-muted-foreground">
          Chunky looked everywhere but couldn&apos;t find this page.
        </p>
      </div>
      <Link
        href="/dashboard"
        className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
