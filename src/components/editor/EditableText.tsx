'use client';

import { useRef } from 'react';

interface Props {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

export function EditableText({ value, onChange, className = '', style }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onBlur={() => {
        if (ref.current) {
          const t = ref.current.innerText;
          if (t !== value) onChange(t);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ref.current?.blur(); }
      }}
      className={`outline-none cursor-text hover:ring-2 hover:ring-purple-200 focus:ring-2 focus:ring-purple-400 rounded px-0.5 -mx-0.5 transition-shadow ${className}`}
      style={style}
      dangerouslySetInnerHTML={{ __html: value }}
    />
  );
}
