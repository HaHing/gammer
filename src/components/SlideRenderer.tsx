'use client';

import type { SlideContent, ThemeConfig } from '@/lib/types';
import type { ThemeDesign } from '@/lib/theme-design';
import { themeDesigns } from '@/lib/theme-design';
import type { StyleTheme } from '@/lib/types';

interface Props {
  slide: SlideContent;
  theme: ThemeConfig;
  themeKey: StyleTheme;
  pageNum: number;
  total: number;
}

export default function SlideRenderer({ slide, theme, themeKey, pageNum, total }: Props) {
  const design = themeDesigns[themeKey] || themeDesigns.google;

  if (slide.type === 'cover') return <CoverSlide slide={slide} theme={theme} design={design} />;
  if (slide.type === 'toc') return <TocSlide slide={slide} theme={theme} design={design} pageNum={pageNum} total={total} />;
  if (slide.type === 'timeline') return <TimelineSlide slide={slide} theme={theme} design={design} pageNum={pageNum} total={total} />;
  if (slide.type === 'comparison') return <ComparisonSlide slide={slide} theme={theme} design={design} pageNum={pageNum} total={total} />;
  return <ContentSlide slide={slide} theme={theme} design={design} pageNum={pageNum} total={total} />;
}

// ─── Cover ───
function CoverSlide({ slide, theme, design }: { slide: SlideContent; theme: ThemeConfig; design: ThemeDesign }) {
  const isDark = !['centered', 'gradient-bottom', 'split-diagonal'].includes(design.coverStyle);
  const bg = getCoverBg(theme, design);

  return (
    <div className="aspect-[16/9] rounded-lg overflow-hidden relative" style={bg}>
      {design.coverStyle === 'haio-dark' && (
        <>
          <div className="absolute left-0 top-0 w-1 h-full" style={{ background: theme.primary }} />
          <div className="absolute right-0 top-0 w-[18%] h-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
        </>
      )}
      <div className="relative z-10 h-full flex flex-col justify-center px-[8%]" style={{ textAlign: design.coverStyle === 'centered' ? 'center' : 'left' }}>
        {design.coverStyle === 'haio-dark' && (
          <div className="text-[6px] tracking-[0.2em] mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>PROFESSIONAL REPORT</div>
        )}
        <h1 className="text-[14px] font-bold leading-tight mb-1" style={{ color: isDark ? '#fff' : theme.primary }}>
          {slide.title}
        </h1>
        {slide.subtitle && (
          <p className="text-[8px] mt-1" style={{ color: isDark ? 'rgba(255,255,255,0.7)' : theme.secondary }}>
            {slide.subtitle}
          </p>
        )}
        {design.coverStyle === 'haio-dark' && (
          <div className="w-[30%] h-[2px] mt-2" style={{ background: theme.primary }} />
        )}
        <div className="mt-3 flex items-center gap-3">
          <span className="text-[6px]" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : theme.secondary }}>
            {new Date().toLocaleDateString('zh-CN')}
          </span>
          <span className="text-[5px] italic" style={{ color: isDark ? 'rgba(255,255,255,0.3)' : theme.secondary }}>
            Powered by Gammer
          </span>
        </div>
      </div>
    </div>
  );
}

function getCoverBg(theme: ThemeConfig, design: ThemeDesign): React.CSSProperties {
  switch (design.coverStyle) {
    case 'haio-dark': return { background: '#1B1F2A' };
    case 'brand-gradient': return { background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})` };
    case 'full-bleed': return { background: theme.primary };
    case 'split-diagonal': return { background: `linear-gradient(90deg, ${theme.primary} 50%, #fff 50%)` };
    case 'gradient-bottom': return { background: `linear-gradient(to bottom, #fff 65%, ${theme.primary} 65%)` };
    case 'centered': return { background: '#fff', borderTop: `3px solid ${theme.primary}`, borderBottom: `3px solid ${theme.primary}` };
    default: return { background: theme.primary };
  }
}

// ─── TOC ───
function TocSlide({ slide, theme, design, pageNum, total }: { slide: SlideContent; theme: ThemeConfig; design: ThemeDesign; pageNum: number; total: number }) {
  return (
    <SlideFrame theme={theme} design={design} pageNum={pageNum} total={total}>
      <SlideTitle title={slide.title || '议程'} theme={theme} />
      <div className="space-y-1 mt-2">
        {(slide.bullets || []).map((item, i) => (
          <div key={i} className="flex items-center gap-2 py-1 px-2 rounded" style={{ background: i % 2 === 0 ? theme.lightGray : 'transparent' }}>
            <div className="w-4 h-4 rounded-full flex items-center justify-center text-[6px] font-bold text-white shrink-0" style={{ background: theme.primary }}>
              {i + 1}
            </div>
            <span className="text-[8px]" style={{ color: theme.text }}>{item}</span>
          </div>
        ))}
      </div>
    </SlideFrame>
  );
}

// ─── Content (all layouts) ───
function ContentSlide({ slide, theme, design, pageNum, total }: { slide: SlideContent; theme: ThemeConfig; design: ThemeDesign; pageNum: number; total: number }) {
  const layout = slide.layout || 'full-text';

  return (
    <SlideFrame theme={theme} design={design} pageNum={pageNum} total={total}>
      <SlideTitle title={slide.title} theme={theme} />
      {slide.subtitle && (
        <p className="text-[7px] mt-0.5 mb-1" style={{ color: theme.secondary, fontStyle: design.subtitleItalic ? 'italic' : 'normal' }}>
          {slide.subtitle}
        </p>
      )}

      {/* Key Metrics */}
      {slide.keyMetrics && slide.keyMetrics.length > 0 && <MetricsRow metrics={slide.keyMetrics} theme={theme} />}

      {/* Insight */}
      {slide.insight && <InsightBox insight={slide.insight} theme={theme} style={design.insightStyle} />}

      {/* Layout-specific content */}
      {layout === 'two-column' && <TwoColumnBullets bullets={slide.bullets || []} theme={theme} design={design} />}
      {layout === 'three-column' && <ThreeColumnBullets bullets={slide.bullets || []} theme={theme} design={design} />}
      {layout === 'big-number' && slide.keyMetrics?.[0] && <BigNumber metric={slide.keyMetrics[0]} theme={theme} />}
      {layout === 'quote-highlight' && <QuoteBlock text={slide.insight || slide.subtitle || ''} source={slide.source} theme={theme} />}
      {layout === 'chart-focus' && slide.chartData && <ChartView data={slide.chartData} theme={theme} chartType={slide.chartType} />}
      {layout === 'table-focus' && slide.tableData && <DataTable data={slide.tableData} theme={theme} />}
      {layout === 'icon-grid' && <IconGrid bullets={slide.bullets || []} theme={theme} />}
      {layout === 'process-flow' && <ProcessFlow bullets={slide.bullets || []} theme={theme} />}
      {layout === 'funnel' && <Funnel bullets={slide.bullets || []} theme={theme} />}
      {layout === 'pyramid' && <Pyramid bullets={slide.bullets || []} theme={theme} />}
      {layout === 'problem-solution' && <ProblemSolution bullets={slide.bullets || []} theme={theme} />}
      {layout === 'highlight' && <Highlight metric={slide.keyMetrics?.[0]} insight={slide.insight} theme={theme} />}
      {!['two-column', 'three-column', 'big-number', 'quote-highlight', 'icon-grid', 'process-flow', 'funnel', 'pyramid', 'problem-solution', 'highlight'].includes(layout) && slide.bullets && slide.bullets.length > 0 && (
        <BulletList bullets={slide.bullets} theme={theme} design={design} />
      )}

      {/* Chart (non chart-focus) */}
      {layout !== 'chart-focus' && slide.chartData && slide.chartData.length > 0 && <ChartView data={slide.chartData} theme={theme} chartType={slide.chartType} />}

      {/* Table (non table-focus) */}
      {layout !== 'table-focus' && slide.tableData?.headers && <DataTable data={slide.tableData} theme={theme} />}

      {/* Source */}
      {slide.source && <p className="text-[5px] mt-1 italic" style={{ color: theme.secondary }}>📎 {slide.source}</p>}
    </SlideFrame>
  );
}

// ─── Timeline ───
function TimelineSlide({ slide, theme, design, pageNum, total }: { slide: SlideContent; theme: ThemeConfig; design: ThemeDesign; pageNum: number; total: number }) {
  const items = slide.bullets || [];
  return (
    <SlideFrame theme={theme} design={design} pageNum={pageNum} total={total}>
      <SlideTitle title={slide.title} theme={theme} />
      <div className="relative mt-3 px-2">
        <div className="absolute top-2 left-0 right-0 h-[2px]" style={{ background: theme.primary }} />
        <div className="flex justify-between relative">
          {items.map((item, i) => (
            <div key={i} className="flex flex-col items-center" style={{ width: `${100 / items.length}%` }}>
              <div className="w-3 h-3 rounded-full flex items-center justify-center text-[5px] font-bold text-white z-10" style={{ background: theme.primary }}>
                {i + 1}
              </div>
              <p className="text-[6px] text-center mt-1 px-0.5 leading-tight" style={{ color: theme.text }}>{item}</p>
            </div>
          ))}
        </div>
      </div>
      {slide.insight && <InsightBox insight={slide.insight} theme={theme} style={design.insightStyle} />}
    </SlideFrame>
  );
}

// ─── Comparison ───
function ComparisonSlide({ slide, theme, design, pageNum, total }: { slide: SlideContent; theme: ThemeConfig; design: ThemeDesign; pageNum: number; total: number }) {
  return (
    <SlideFrame theme={theme} design={design} pageNum={pageNum} total={total}>
      <SlideTitle title={slide.title} theme={theme} />
      {slide.subtitle && <p className="text-[7px] mb-1" style={{ color: theme.secondary }}>{slide.subtitle}</p>}
      {slide.tableData?.headers ? (
        <DataTable data={slide.tableData} theme={theme} />
      ) : (
        <TwoColumnBullets bullets={slide.bullets || []} theme={theme} design={design} />
      )}
      {slide.insight && <InsightBox insight={slide.insight} theme={theme} style={design.insightStyle} />}
    </SlideFrame>
  );
}

// ─── Shared Components ───

function SlideFrame({ children, theme, design, pageNum, total }: { children: React.ReactNode; theme: ThemeConfig; design: ThemeDesign; pageNum: number; total: number }) {
  return (
    <div className="aspect-[16/9] rounded-lg overflow-hidden relative" style={{ background: theme.background }}>
      {/* Accent */}
      {design.accentPosition === 'left-bar' && <div className="absolute left-0 top-0 w-[3px] h-full" style={{ background: theme.primary }} />}
      {design.accentPosition === 'top-line' && <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: theme.primary }} />}
      {design.accentPosition === 'side-stripe' && <div className="absolute right-0 top-0 w-[12px] h-full opacity-10" style={{ background: theme.primary }} />}

      {/* Card wrapper for haio */}
      <div className={`h-full px-[5%] py-[4%] flex flex-col overflow-hidden ${design.useCard ? '' : ''}`}>
        {design.useCard ? (
          <div className="flex-1 bg-white rounded-md shadow-sm border-l-2 px-3 py-2 overflow-hidden" style={{ borderColor: theme.primary }}>
            {children}
          </div>
        ) : children}
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
        {design.footerStyle === 'full-bar' && <div className="h-[1px] opacity-50" style={{ background: theme.primary }} />}
        <div className="px-[5%] py-0.5 flex justify-end">
          <span className="text-[4px] opacity-60" style={{ color: theme.secondary }}>{pageNum} / {total}</span>
        </div>
      </div>
    </div>
  );
}

function SlideTitle({ title, theme }: { title: string; theme: ThemeConfig }) {
  return (
    <div className="mb-1">
      <h2 className="text-[10px] font-bold leading-tight" style={{ color: theme.primary }}>{title}</h2>
      <div className="w-8 h-[2px] mt-0.5" style={{ background: theme.accent }} />
    </div>
  );
}

function MetricsRow({ metrics, theme }: { metrics: NonNullable<SlideContent['keyMetrics']>; theme: ThemeConfig }) {
  return (
    <div className="flex gap-1 my-1">
      {metrics.slice(0, 4).map((m, i) => (
        <div key={i} className="flex-1 rounded px-1.5 py-1 text-center relative overflow-hidden" style={{ background: theme.lightGray }}>
          <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: i === 0 ? theme.primary : theme.accent }} />
          {m.trend && (
            <span className="absolute top-0.5 right-1 text-[5px]" style={{ color: m.trend === 'up' ? '#34A853' : m.trend === 'down' ? '#EA4335' : theme.secondary }}>
              {m.trend === 'up' ? '▲' : m.trend === 'down' ? '▼' : '●'}
            </span>
          )}
          <div className="text-[10px] font-bold" style={{ color: theme.primary }}>{m.value}{m.unit ? ` ${m.unit}` : ''}</div>
          <div className="text-[5px]" style={{ color: theme.secondary }}>{m.label}</div>
        </div>
      ))}
    </div>
  );
}

function InsightBox({ insight, theme, style }: { insight: string; theme: ThemeConfig; style?: string }) {
  if (style === 'banner') {
    return (
      <div className="my-1 px-2 py-1 rounded text-[6px] font-medium text-white" style={{ background: theme.primary }}>
        💡 {insight}
      </div>
    );
  }
  if (style === 'box') {
    return (
      <div className="my-1 px-2 py-1 rounded text-[6px] font-medium shadow-sm" style={{ background: theme.lightGray, borderLeft: `2px solid ${theme.accent}`, color: theme.text }}>
        💡 {insight}
      </div>
    );
  }
  return (
    <div className="my-1 px-2 py-1 rounded text-[6px] font-medium" style={{ background: theme.lightGray, borderLeft: `2px solid ${theme.primary}`, color: theme.text }}>
      💡 {insight}
    </div>
  );
}

function BulletList({ bullets, theme, design }: { bullets: string[]; theme: ThemeConfig; design: ThemeDesign }) {
  const chars: Record<string, string> = { circle: '●', square: '■', dash: '—', arrow: '▸', number: '' };
  const char = chars[design.bulletStyle] || '●';
  return (
    <div className="space-y-0.5 mt-1">
      {bullets.map((b, i) => (
        <div key={i} className="flex gap-1 text-[7px] leading-snug">
          <span className="shrink-0 text-[5px] mt-0.5" style={{ color: theme.primary }}>
            {design.bulletStyle === 'number' ? `${i + 1}.` : char}
          </span>
          <span style={{ color: theme.text }}>{b}</span>
        </div>
      ))}
    </div>
  );
}

function TwoColumnBullets({ bullets, theme, design }: { bullets: string[]; theme: ThemeConfig; design: ThemeDesign }) {
  const mid = Math.ceil(bullets.length / 2);
  return (
    <div className="grid grid-cols-2 gap-2 mt-1">
      <div>
        <div className="h-[2px] mb-1 rounded" style={{ background: theme.primary }} />
        <BulletList bullets={bullets.slice(0, mid)} theme={theme} design={design} />
      </div>
      <div>
        <div className="h-[2px] mb-1 rounded" style={{ background: theme.accent }} />
        <BulletList bullets={bullets.slice(mid)} theme={theme} design={design} />
      </div>
    </div>
  );
}

function ThreeColumnBullets({ bullets, theme, design }: { bullets: string[]; theme: ThemeConfig; design: ThemeDesign }) {
  const third = Math.ceil(bullets.length / 3);
  return (
    <div className="grid grid-cols-3 gap-1.5 mt-1">
      {[bullets.slice(0, third), bullets.slice(third, third * 2), bullets.slice(third * 2)].map((col, i) => (
        <div key={i}>
          <div className="text-[5px] font-bold text-white text-center py-0.5 rounded-sm mb-0.5" style={{ background: theme.primary }}>{i + 1}</div>
          <BulletList bullets={col} theme={theme} design={design} />
        </div>
      ))}
    </div>
  );
}

function BigNumber({ metric, theme }: { metric: NonNullable<SlideContent['keyMetrics']>[0]; theme: ThemeConfig }) {
  return (
    <div className="text-center my-2">
      <div className="text-[28px] font-bold" style={{ color: theme.primary }}>{metric.value}{metric.unit ? ` ${metric.unit}` : ''}</div>
      <div className="text-[8px]" style={{ color: theme.secondary }}>{metric.label}</div>
      {metric.trend && (
        <span className="text-[10px]" style={{ color: metric.trend === 'up' ? '#34A853' : metric.trend === 'down' ? '#EA4335' : theme.secondary }}>
          {metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→'}
        </span>
      )}
    </div>
  );
}

function QuoteBlock({ text, source, theme }: { text: string; source?: string; theme: ThemeConfig }) {
  return (
    <div className="my-2 px-3 py-2 rounded relative" style={{ background: theme.lightGray }}>
      <span className="absolute top-0 left-1 text-[20px] leading-none opacity-20" style={{ color: theme.primary }}>&ldquo;</span>
      <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded" style={{ background: theme.primary }} />
      <p className="text-[8px] italic pl-3 leading-relaxed" style={{ color: theme.text }}>{text}</p>
      {source && <p className="text-[6px] text-right mt-1 italic" style={{ color: theme.secondary }}>— {source}</p>}
    </div>
  );
}

function ChartView({ data, theme, chartType }: { data: NonNullable<SlideContent['chartData']>; theme: ThemeConfig; chartType?: string }) {
  if (chartType === 'pie' || chartType === 'doughnut') return <PieChart data={data} theme={theme} isDoughnut={chartType === 'doughnut'} />;
  return <BarChart data={data} theme={theme} />;
}

function PieChart({ data, theme, isDoughnut }: { data: NonNullable<SlideContent['chartData']>; theme: ThemeConfig; isDoughnut: boolean }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return null;
  const colors = [theme.primary, theme.accent, theme.secondary, '#34A853', '#FBBC04', '#EA4335'];

  // Pre-compute cumulative angles
  const angles = data.reduce<number[]>((acc, d) => { acc.push((acc[acc.length - 1] || 0) + (d.value / total) * 360); return acc; }, []);

  const segments = data.map((d, i) => {
    const angle = (d.value / total) * 360;
    const startAngle = i === 0 ? 0 : angles[i - 1];
    const startRad = (startAngle - 90) * Math.PI / 180;
    const endRad = (startAngle + angle - 90) * Math.PI / 180;
    const largeArc = angle > 180 ? 1 : 0;
    const r = 40, cx = 50, cy = 50;
    const ir = isDoughnut ? 22 : 0;
    const x1 = cx + r * Math.cos(startRad), y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad), y2 = cy + r * Math.sin(endRad);
    if (isDoughnut) {
      const ix1 = cx + ir * Math.cos(startRad), iy1 = cy + ir * Math.sin(startRad);
      const ix2 = cx + ir * Math.cos(endRad), iy2 = cy + ir * Math.sin(endRad);
      return <path key={i} d={`M${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} L${ix2},${iy2} A${ir},${ir} 0 ${largeArc},0 ${ix1},${iy1} Z`} fill={colors[i % colors.length]} />;
    }
    return <path key={i} d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`} fill={colors[i % colors.length]} />;
  });

  return (
    <div className="flex items-center gap-2 mt-1">
      <svg viewBox="0 0 100 100" className="w-16 h-16 shrink-0">{segments}</svg>
      <div className="space-y-0.5">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-1 text-[5px]">
            <div className="w-1.5 h-1.5 rounded-sm shrink-0" style={{ background: colors[i % colors.length] }} />
            <span style={{ color: theme.text }}>{d.label} ({Math.round((d.value / total) * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarChart({ data, theme }: { data: NonNullable<SlideContent['chartData']>; theme: ThemeConfig }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-0.5 h-16 mt-1 px-1">
      {data.map((d, i) => {
        const h = (d.value / max) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
            <span className="text-[5px] font-bold" style={{ color: theme.primary }}>{d.value}</span>
            <div className="w-full rounded-t transition-all" style={{ height: `${h}%`, background: i % 2 === 0 ? theme.primary : theme.accent, minHeight: 2 }} />
            <span className="text-[4px] truncate w-full text-center" style={{ color: theme.secondary }}>{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function IconGrid({ bullets, theme }: { bullets: string[]; theme: ThemeConfig }) {
  const cols = bullets.length <= 4 ? 2 : 3;
  return (
    <div className="mt-1" style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '4px' }}>
      {bullets.map((item, i) => {
        const emojiMatch = item.match(/^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F?)\s*/u);
        const emoji = emojiMatch ? emojiMatch[1] : '●';
        const text = emojiMatch ? item.slice(emojiMatch[0].length) : item;
        return (
          <div key={i} className="rounded px-1.5 py-1.5 text-center" style={{ background: theme.lightGray }}>
            <div className="text-[12px]">{emoji}</div>
            <div className="text-[6px] mt-0.5 leading-tight" style={{ color: theme.text }}>{text}</div>
          </div>
        );
      })}
    </div>
  );
}

function ProcessFlow({ bullets, theme }: { bullets: string[]; theme: ThemeConfig }) {
  return (
    <div className="mt-2 relative">
      <div className="absolute top-2 left-0 right-0 h-[2px] opacity-30" style={{ background: theme.primary }} />
      <div className="flex justify-between relative">
        {bullets.map((step, i) => (
          <div key={i} className="flex flex-col items-center" style={{ width: `${100 / bullets.length}%` }}>
            <div className="w-4 h-4 rounded-full flex items-center justify-center text-[6px] font-bold text-white z-10" style={{ background: theme.primary }}>
              {i + 1}
            </div>
            {i < bullets.length - 1 && (
              <span className="absolute text-[8px] font-bold" style={{ color: theme.primary, left: `${(i + 0.7) * (100 / bullets.length)}%`, top: '0px' }}>→</span>
            )}
            <p className="text-[5px] text-center mt-1 px-0.5 leading-tight" style={{ color: theme.text }}>{step}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Funnel({ bullets, theme }: { bullets: string[]; theme: ThemeConfig }) {
  return (
    <div className="mt-1 space-y-0.5 flex flex-col items-center">
      {bullets.map((item, i) => {
        const ratio = 1 - (i / bullets.length) * 0.5;
        const opacity = 0.3 + (i / bullets.length) * 0.5;
        return (
          <div key={i} className="rounded py-1 text-center text-[6px]" style={{ width: `${ratio * 90}%`, background: theme.primary, opacity, color: '#fff' }}>
            {item}
          </div>
        );
      })}
    </div>
  );
}

// ─── Pyramid (战略-战术-执行) ───
function Pyramid({ bullets, theme }: { bullets: string[]; theme: ThemeConfig }) {
  const layers = bullets.slice(0, 4);
  return (
    <div className="mt-2 flex flex-col items-center gap-0.5">
      {layers.map((item, i) => {
        const w = 30 + (i / layers.length) * 60;
        return (
          <div key={i} className="text-center py-1 text-[6px] font-medium" style={{
            width: `${w}%`, background: i === 0 ? theme.primary : theme.lightGray,
            color: i === 0 ? '#fff' : theme.text, borderLeft: `2px solid ${theme.primary}`,
          }}>{item}</div>
        );
      })}
    </div>
  );
}

// ─── Problem-Solution (问题-原因-对策) ───
function ProblemSolution({ bullets, theme }: { bullets: string[]; theme: ThemeConfig }) {
  const cols = [bullets.slice(0, Math.ceil(bullets.length / 3)), bullets.slice(Math.ceil(bullets.length / 3), Math.ceil(bullets.length * 2 / 3)), bullets.slice(Math.ceil(bullets.length * 2 / 3))];
  const headers = ['问题', '原因', '对策'];
  return (
    <div className="grid grid-cols-3 gap-1.5 mt-1">
      {cols.map((col, i) => (
        <div key={i}>
          <div className="text-[6px] font-bold text-center py-0.5 rounded-t" style={{ background: i === 2 ? theme.primary : theme.lightGray, color: i === 2 ? '#fff' : theme.primary }}>{headers[i]}</div>
          {col.map((b, j) => (
            <div key={j} className="text-[5px] py-0.5 px-1 border-b" style={{ borderColor: theme.lightGray, color: theme.text }}>{b}</div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Highlight (关键数据高亮) ───
function Highlight({ metric, insight, theme }: { metric?: { label: string; value: string; unit?: string }; insight?: string; theme: ThemeConfig }) {
  return (
    <div className="mt-2 text-center">
      {metric && (
        <>
          <div className="text-[24px] font-bold" style={{ color: theme.primary }}>{metric.value}{metric.unit ? ` ${metric.unit}` : ''}</div>
          <div className="text-[7px] mt-0.5" style={{ color: theme.secondary }}>{metric.label}</div>
        </>
      )}
      {insight && <div className="mt-1.5 text-[6px] px-3 py-1 rounded mx-auto inline-block" style={{ background: theme.lightGray, color: theme.text }}>{insight}</div>}
    </div>
  );
}

function DataTable({ data, theme }: { data: { headers: string[]; rows: string[][] }; theme: ThemeConfig }) {
  return (
    <div className="mt-1 overflow-hidden rounded text-[6px]">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {data.headers.map((h, i) => (
              <th key={i} className="px-1 py-0.5 text-white text-center font-medium" style={{ background: theme.primary }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.slice(0, 8).map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className="px-1 py-0.5 border-b" style={{ background: i % 2 === 0 ? '#fff' : theme.lightGray, borderColor: '#E5E7EB', color: theme.text }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
