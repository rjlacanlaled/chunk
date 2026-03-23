'use client';

const CHIP_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  thinking: { label: 'Thinking...', color: 'thinking', icon: '/chunk-tools/tool-thinking.svg' },
  createTasks: { label: 'Creating tasks', color: 'create', icon: '/chunk-tools/tool-createTasks.svg' },
  completeTasks: { label: 'Completing tasks', color: 'complete', icon: '/chunk-tools/tool-completeTasks.svg' },
  updateTasks: { label: 'Updating tasks', color: 'update', icon: '/chunk-tools/tool-updateTasks.svg' },
  deleteTasks: { label: 'Deleting tasks', color: 'delete', icon: '/chunk-tools/tool-deleteTasks.svg' },
  searchTasks: { label: 'Searching tasks', color: 'search', icon: '/chunk-tools/tool-searchTasks.svg' },
  listTasks: { label: 'Listing tasks', color: 'list', icon: '/chunk-tools/tool-listTasks.svg' },
};

const COLORS: Record<string, { bg: string; border: string; text: string }> = {
  thinking: { bg: 'rgba(73,69,255,.07)', border: 'rgba(73,69,255,.16)', text: 'rgba(139,137,255,.65)' },
  create: { bg: 'rgba(73,69,255,.12)', border: 'rgba(73,69,255,.28)', text: '#8B89FF' },
  complete: { bg: 'rgba(92,177,118,.10)', border: 'rgba(92,177,118,.28)', text: '#6FCA8E' },
  update: { bg: 'rgba(239,159,39,.10)', border: 'rgba(239,159,39,.28)', text: '#F0B843' },
  delete: { bg: 'rgba(226,75,74,.10)', border: 'rgba(226,75,74,.28)', text: '#FF7A79' },
  search: { bg: 'rgba(73,69,255,.12)', border: 'rgba(73,69,255,.28)', text: '#8B89FF' },
  list: { bg: 'rgba(151,54,232,.10)', border: 'rgba(151,54,232,.28)', text: '#C47EF5' },
};

interface ToolChipProps {
  tool: string;
  state?: string;
  input?: Record<string, unknown>;
}

export default function ToolChip({ tool, state, input }: ToolChipProps) {
  const config = CHIP_CONFIG[tool] ?? CHIP_CONFIG.thinking;
  const colors = COLORS[config.color] ?? COLORS.thinking;
  const isComplete = state === 'output-available';

  // Build detail string from input args
  let detail = '';
  if (input) {
    if (input.title) detail = `: ${input.title}`;
    else if (Array.isArray(input.tasks)) detail = ` (${input.tasks.length})`;
    else if (Array.isArray(input.names)) detail = ` (${input.names.length})`;
    else if (Array.isArray(input.updates)) detail = ` (${input.updates.length})`;
    else if (input.query) detail = `: "${input.query}"`;
    else if (input.filter) detail = `: ${input.filter}`;
  }

  const label = isComplete
    ? config.label.replace('...', '').replace('ing ', 'ed ').trim()
    : config.label;

  return (
    <span
      className="inline-flex w-fit items-center gap-2 rounded-lg text-[13px] font-semibold"
      style={{
        padding: '6px 14px 6px 4px',
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        color: colors.text,
        letterSpacing: '-0.1px',
      }}
    >
      <img
        src={isComplete ? config.icon.replace('.svg', '-idle.svg') : config.icon}
        alt=""
        className="size-7 shrink-0 rounded-full"
      />
      <span className={isComplete ? '' : 'animate-shimmer-text'}>
        {label}{detail}
      </span>
    </span>
  );
}
