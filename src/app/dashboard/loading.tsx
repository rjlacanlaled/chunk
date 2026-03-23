export default function DashboardLoading() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background">
      <img src="/chunk-tools/chunky-avatar-thinking.svg" alt="Loading" className="size-16" />
      <p className="animate-shimmer-text text-sm font-medium">
        Getting things ready...
      </p>
    </div>
  );
}
