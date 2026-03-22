export function BoardPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
      <div className="text-4xl">🚀</div>
      <h2 className="text-lg font-semibold text-foreground">Coming Soon</h2>
      <p className="text-sm text-center max-w-xs">
        Board view is on its way. For now, manage your tasks via the list or just chat!
      </p>
    </div>
  );
}
