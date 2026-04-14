'use client';

const STEPS = ['搜索', '大纲', '生成', '检查', '优化'];
const STEP_ICONS = ['🔍', '📋', '✍️', '✅', '⚡'];

export function Progress({ phase, done, total, accent }: { phase: string; done: number; total: number; accent: string }) {
  const map: Record<string, number> = { outline: 0, research: 1, generating: 2, checking: 3, optimizing: 4, done: 5 };
  const idx = map[phase] ?? 0;
  const pct = phase === 'outline' ? 5
    : phase === 'research' ? 15
    : phase === 'generating' ? 20 + Math.round((done / Math.max(total, 1)) * 55)
    : phase === 'checking' ? 80 : phase === 'optimizing' ? 90 : phase === 'done' ? 100 : 3;

  return (
    <div className="mb-5 p-4 rounded-xl" style={{ background: 'var(--bg-0)', border: '1px solid var(--border-0)' }}>
      <div className="flex items-center justify-between mb-4">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center" style={{ flex: i < STEPS.length - 1 ? 1 : 'none' }}>
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-semibold transition-all duration-300 ${idx === i ? 'step-active' : ''}`}
                style={{ background: idx > i ? 'var(--success)' : idx === i ? accent : 'var(--bg-2)', color: idx >= i ? '#fff' : 'var(--text-2)', border: idx === i ? `2px solid ${accent}` : 'none' }}>
                {idx > i ? '✓' : STEP_ICONS[i]}
              </div>
              <span className="text-[10px] font-medium" style={{ color: idx === i ? accent : idx > i ? 'var(--success)' : 'var(--text-2)' }}>{s}</span>
            </div>
            {i < STEPS.length - 1 && <div className="flex-1 h-[2px] mx-2 rounded-full transition-all duration-500" style={{ background: idx > i ? 'var(--success)' : 'var(--bg-3)' }} />}
          </div>
        ))}
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-2)' }}>
        <div className="h-full rounded-full transition-all duration-700 ease-out progress-bar-animated" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${accent}, ${accent}CC, ${accent})` }} />
      </div>
      <div className="flex justify-between mt-2">
        <span className="text-[12px] font-medium" style={{ color: 'var(--text-0)' }}>
          {phase === 'generating' && done > 0 ? `正在生成第 ${done + 1} 页（共 ${total} 页）`
            : phase === 'outline' ? '正在生成大纲...' : phase === 'research' ? '正在搜索权威数据源...'
            : phase === 'checking' ? '正在检查内容质量...' : phase === 'optimizing' ? '正在优化内容...'
            : phase === 'done' ? '生成完成！' : '准备中...'}
        </span>
        <span className="text-[12px] tabular-nums font-semibold" style={{ color: accent }}>{pct}%</span>
      </div>
      {phase === 'generating' && done > 0 && (
        <div className="flex gap-1 mt-2 flex-wrap">
          {Array.from({ length: total }, (_, i) => (
            <div key={i} className="w-6 h-1.5 rounded-full transition-all duration-300" style={{ background: i < done ? accent : 'var(--bg-3)' }} />
          ))}
        </div>
      )}
    </div>
  );
}
