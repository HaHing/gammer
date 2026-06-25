'use client';

import type { DiagramMode } from '@/lib/types';

const MODES: { id: DiagramMode; label: string; icon: string; desc: string }[] = [
  { id: 'flowchart',    label: '流程图',   icon: '⬡', desc: '步骤、决策、流程' },
  { id: 'sequence',     label: '时序图',   icon: '↔', desc: '服务间调用顺序' },
  { id: 'architecture', label: '架构图',   icon: '⬜', desc: '系统组件与层次' },
  { id: 'er',           label: 'ER 图',    icon: '⊞', desc: '数据库实体关系' },
  { id: 'mindmap',      label: '思维导图', icon: '✦', desc: '主题与子主题' },
  { id: 'network',      label: '网络拓扑', icon: '◎', desc: '节点与连接' },
  { id: 'orgchart',     label: '组织架构', icon: '▤', desc: '层级汇报关系' },
];

interface Props {
  value: DiagramMode;
  onChange: (mode: DiagramMode) => void;
}

export default function DiagramModeSelector({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2 p-3 rounded-xl border" style={{ borderColor: 'var(--border-0)' }}>
      {MODES.map(m => (
        <button
          key={m.id}
          onClick={() => onChange(m.id)}
          title={m.desc}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={
            value === m.id
              ? { background: 'var(--accent)', color: '#fff' }
              : { color: 'var(--text-1)' }
          }
        >
          <span>{m.icon}</span>
          {m.label}
        </button>
      ))}
    </div>
  );
}
