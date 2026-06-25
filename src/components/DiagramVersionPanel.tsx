'use client';

import { useEffect, useState } from 'react';

interface Version {
  id: string;
  label: string | null;
  createdAt: string;
}

interface Props {
  projectId: string;
  slideIndex: number;
  onRestore: (xml: string) => void;
}

export default function DiagramVersionPanel({ projectId, slideIndex, onRestore }: Props) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/diagram/versions?projectId=${projectId}&slideIndex=${slideIndex}`)
      .then(r => r.json())
      .then(data => { setVersions(Array.isArray(data) ? data : []); })
      .finally(() => setLoading(false));
  }, [projectId, slideIndex]);

  const restore = async (versionId: string) => {
    const res = await fetch(`/api/diagram/versions/${versionId}`);
    const data = await res.json();
    if (data.xml) onRestore(data.xml);
  };

  const deleteVersion = async (versionId: string) => {
    await fetch(`/api/diagram/versions/${versionId}`, { method: 'DELETE' });
    setVersions(v => v.filter(x => x.id !== versionId));
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold" style={{ color: 'var(--text-1)' }}>
        历史版本 ({versions.length})
      </p>
      {loading && <p className="text-xs" style={{ color: 'var(--text-2)' }}>加载中…</p>}
      {!loading && versions.length === 0 && (
        <p className="text-xs" style={{ color: 'var(--text-2)' }}>暂无历史版本</p>
      )}
      <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
        {versions.map((v, i) => (
          <div
            key={v.id}
            className="flex items-center justify-between px-2 py-1.5 rounded-lg text-xs"
            style={{ background: 'var(--bg-2)' }}
          >
            <span style={{ color: 'var(--text-0)' }}>
              {v.label ?? `版本 ${versions.length - i}`}
              <span className="ml-1.5 text-[10px]" style={{ color: 'var(--text-2)' }}>
                {new Date(v.createdAt).toLocaleString('zh-CN', {
                  month: 'numeric',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => restore(v.id)}
                className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                style={{ background: 'var(--accent)', color: '#fff' }}
              >
                还原
              </button>
              <button
                onClick={() => deleteVersion(v.id)}
                className="px-1.5 py-0.5 rounded text-[10px]"
                style={{ color: 'var(--text-2)' }}
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
