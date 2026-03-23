'use client';

const CHIP_CONFIG: Record<string, { label: string; color: string }> = {
  thinking: { label: 'Thinking...', color: 'thinking' },
  createTasks: { label: 'Creating tasks', color: 'create' },
  completeTasks: { label: 'Completing tasks', color: 'complete' },
  updateTasks: { label: 'Updating tasks', color: 'update' },
  deleteTasks: { label: 'Deleting tasks', color: 'delete' },
  searchTasks: { label: 'Searching tasks', color: 'search' },
  listTasks: { label: 'Listing tasks', color: 'list' },
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

function ToolIcon({ tool, size = 18 }: { tool: string; size?: number }) {
  const s = size;
  const icons: Record<string, React.ReactNode> = {
    thinking: (
      <svg width={s} height={s} viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(139,137,255,.45)" strokeWidth="2"
          strokeDasharray="10 6" strokeLinecap="round"
          style={{ animation: 'th-spin 1.8s linear infinite', transformOrigin: '18px 18px' }} />
        {[10, 18, 26].map((cx, i) => (
          <circle key={cx} cx={cx} cy="18" r="3.5" fill="#8B89FF"
            style={{ animation: `th-d 1.4s ease-in-out ${i * 0.2}s infinite`, transformOrigin: `${cx}px 18px` }} />
        ))}
      </svg>
    ),
    createTasks: (
      <svg width={s} height={s} viewBox="0 0 36 36">
        {[[4, 18], [12, 13], [20, 9]].map(([y, w], i) => (
          <rect key={y} x="2" y={y} width={w} height="5" rx="2.5" fill="#8B89FF" opacity={1 - 0.2 * i}
            style={{ animation: `ct-bar 2s ease-in-out ${i * 0.2}s infinite`, transformOrigin: 'left center' }} />
        ))}
        <g style={{ animation: 'ct-plus 2s ease-in-out infinite', transformOrigin: '28px 10px' }}>
          <circle cx="28" cy="10" r="8" fill="#5CB176" />
          <rect x="24.5" y="9" width="7" height="2" rx="1" fill="white" />
          <rect x="27" y="6.5" width="2" height="7" rx="1" fill="white" />
        </g>
      </svg>
    ),
    completeTasks: (
      <svg width={s} height={s} viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="14" fill="none" stroke="#6FCA8E" strokeWidth="2.8"
          transform="rotate(-90 18 18)" strokeLinecap="round"
          style={{ animation: 'ck-ring 2s ease-in-out infinite', strokeDasharray: 88 }} />
        <path d="M10 18 l6 6 l10 -12" fill="none" stroke="#6FCA8E" strokeWidth="2.8"
          strokeLinecap="round" strokeLinejoin="round"
          style={{ animation: 'ck-draw 2s ease-in-out infinite', strokeDasharray: 28 }} />
      </svg>
    ),
    updateTasks: (
      <svg width={s} height={s} viewBox="0 0 36 36">
        {[5, 13, 21].map((y, i) => (
          <rect key={y} x="2" y={y} width={[18, 13, 9][i]} height="5" rx="2.5" fill="#F0B843" opacity={0.9 - 0.15 * i}
            style={{ animation: `up-bar 2s ease-in-out ${i * 0.15}s infinite`, transformOrigin: 'left center' }} />
        ))}
        <g style={{ animation: 'up-spin 2s cubic-bezier(.4,0,.2,1) infinite', transformOrigin: '28px 12px' }}>
          <path d="M34 9 a8 8 0 1 1 -8 8" fill="none" stroke="#F0B843" strokeWidth="2.2" strokeLinecap="round" />
          <polygon points="34,5 34,13 27,9" fill="#F0B843" />
        </g>
      </svg>
    ),
    deleteTasks: (
      <svg width={s} height={s} viewBox="0 0 36 36">
        <g style={{ animation: 'del-body 2s ease-in-out infinite', transformOrigin: '18px 23px' }}>
          <rect x="8" y="14" width="20" height="18" rx="3.5" fill="none" stroke="#FF7A79" strokeWidth="2" />
          {[13, 17, 21].map((x, i) => (
            <rect key={x} x={x} y="18" width="2.5" height="10" rx="1.25" fill="#FF7A79"
              style={{ animation: `del-bar 2s ease-in-out ${i * 0.12}s infinite`, transformOrigin: 'center top' }} />
          ))}
        </g>
        <g style={{ animation: 'del-lid 2s ease-in-out infinite', transformOrigin: '18px 14px' }}>
          <rect x="5" y="9" width="26" height="5" rx="2.5" fill="#FF7A79" />
          <rect x="12" y="4" width="12" height="5" rx="2.5" fill="#FF7A79" opacity=".7" />
        </g>
      </svg>
    ),
    searchTasks: (
      <svg width={s} height={s} viewBox="0 0 36 36">
        <g style={{ animation: 'sc-pulse 2s ease-in-out infinite', transformOrigin: '15px 15px' }}>
          <circle cx="15" cy="15" r="9" fill="none" stroke="#8B89FF" strokeWidth="2.2" />
          <line x1="10" y1="15" x2="20" y2="15" stroke="#8B89FF" strokeWidth="1.5" strokeLinecap="round"
            style={{ animation: 'sc-scan 2s ease-in-out infinite' }} />
        </g>
        <g style={{ animation: 'sc-handle 2s ease-in-out infinite', transformOrigin: '21px 21px' }}>
          <line x1="21" y1="21" x2="31" y2="31" stroke="#8B89FF" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      </svg>
    ),
    listTasks: (
      <svg width={s} height={s} viewBox="0 0 36 36">
        {[0, 0.2, 0.4].map((delay, i) => (
          <g key={i} style={{ animation: `lt-row 2.4s ease-out ${delay}s infinite` }}>
            <circle cx="5" cy={8 + i * 10} r="3" fill="#C47EF5" opacity={1 - 0.2 * i} />
            <rect x="12" y={6 + i * 10} width={[20, 15, 18][i]} height="4" rx="2" fill="#C47EF5" opacity={0.85 - 0.15 * i} />
          </g>
        ))}
      </svg>
    ),
  };
  return <>{icons[tool] ?? icons.thinking}</>;
}

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
      className="inline-flex w-fit items-center gap-2 rounded-full text-[13px] font-semibold"
      style={{
        padding: '6px 14px 6px 8px',
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        color: colors.text,
        letterSpacing: '-0.1px',
      }}
    >
      {isComplete ? (
        <svg width={18} height={18} viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="14" fill="none" stroke={colors.text} strokeWidth="2.8" opacity="0.4" />
          <path d="M10 18 l6 6 l10 -12" fill="none" stroke={colors.text} strokeWidth="2.8"
            strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <ToolIcon tool={tool} size={18} />
      )}
      <span className={isComplete ? '' : 'animate-shimmer-text'}>
        {label}{detail}
      </span>
    </span>
  );
}
