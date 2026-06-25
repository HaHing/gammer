'use client';

import { useEffect, useRef, useId, useState } from 'react';
import type { ThemeConfig } from '@/lib/types';
import { parseMermaidFlowchart } from '@/lib/mermaid-parser';

interface Props {
  code: string;
  theme: ThemeConfig;
  className?: string;
}

export default function MermaidDiagram({ code, theme, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const uniqueId = useId().replace(/:/g, '_');
  const [error, setError] = useState<string | null>(null);

  function normalizeMermaidCode(raw: string): string {
    let next = (raw || '').trim();
    next = next.replace(/^```(?:mermaid)?\s*/i, '').replace(/```$/i, '').trim();
    return next;
  }

  function validateMermaidCode(raw: string): { ok: true; normalized: string } | { ok: false; reason: string } {
    const normalized = normalizeMermaidCode(raw);
    if (!normalized) return { ok: false, reason: '图表代码为空' };
    if (!/^(?:graph|flowchart)\s+/im.test(normalized)) {
      return { ok: false, reason: '缺少 graph/flowchart 声明' };
    }
    if (!/(-->|---|-\.->|==>)/.test(normalized)) {
      return { ok: false, reason: '缺少连线定义' };
    }
    try {
      const parsed = parseMermaidFlowchart(normalized);
      if (parsed.nodes.length === 0 || parsed.edges.length === 0) {
        return { ok: false, reason: '节点或连线不足' };
      }
      return { ok: true, normalized };
    } catch {
      return { ok: false, reason: '语法无法解析' };
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function render() {
      const validated = validateMermaidCode(code);
      if (!validated.ok) {
        if (!cancelled) {
          if (containerRef.current) containerRef.current.innerHTML = '';
          setError(`Mermaid 语法无效：${validated.reason}`);
        }
        return;
      }

      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          suppressErrorRendering: true,
          theme: 'base',
          themeVariables: {
            primaryColor: theme.primary + '22',
            primaryBorderColor: theme.primary,
            primaryTextColor: theme.text,
            secondaryColor: theme.accent + '22',
            secondaryBorderColor: theme.accent,
            tertiaryColor: theme.lightGray,
            lineColor: theme.secondary,
            textColor: theme.text,
            fontSize: '11px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          },
          flowchart: {
            htmlLabels: true,
            curve: 'basis',
            padding: 8,
            nodeSpacing: 30,
            rankSpacing: 40,
          },
        });

        const id = `mermaid_${uniqueId}_${Date.now()}`;
        const { svg } = await mermaid.render(id, validated.normalized);

        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
          // Make SVG responsive
          const svgEl = containerRef.current.querySelector('svg');
          if (svgEl) {
            svgEl.style.maxWidth = '100%';
            svgEl.style.maxHeight = '100%';
            svgEl.style.height = 'auto';
            svgEl.removeAttribute('height');
          }
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          if (containerRef.current) containerRef.current.innerHTML = '';
          setError(err instanceof Error ? err.message : 'Mermaid render failed');
        }
      }
    }

    render();
    return () => { cancelled = true; };
  }, [code, theme.primary, theme.accent, theme.secondary, theme.text, theme.lightGray, uniqueId]);

  if (error) {
    return (
      <div className={`mt-1 px-2 py-1 rounded text-[5px] ${className || ''}`} style={{ background: theme.lightGray, color: theme.secondary }}>
        <p className="font-medium">图表渲染失败：{error}</p>
        <pre className="mt-1 whitespace-pre-wrap font-mono opacity-80">{normalizeMermaidCode(code)}</pre>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`mt-1 flex items-center justify-center [&_svg]:max-w-full [&_svg]:h-auto ${className || ''}`}
      style={{ minHeight: '30px' }}
    />
  );
}
