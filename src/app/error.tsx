'use client';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4">
      <img src="/chunk-tools/chunky-avatar-idle.svg" alt="Chunky" className="size-20" />
      <div className="text-center">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-muted-foreground">
          Chunky tripped over something. Let&apos;s try again.
        </p>
      </div>
      <button
        type="button"
        onClick={reset}
        className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Try again
      </button>
    </div>
  );
}
