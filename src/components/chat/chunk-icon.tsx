type IconVariant = 'static' | 'idle' | 'animated';

const ICON_SRC: Record<IconVariant, string> = {
  static: '/chunk-logos/chunk-ai-icon.svg',
  idle: '/chunk-logos/chunk-ai-icon-idle.svg',
  animated: '/chunk-logos/chunk-ai-icon-animated.svg',
};

export function ChunkIcon({
  className,
  variant = 'static',
}: {
  className?: string;
  variant?: IconVariant;
}) {
  return (
    <img
      src={ICON_SRC[variant]}
      alt="Chunk"
      className={className}
    />
  );
}
