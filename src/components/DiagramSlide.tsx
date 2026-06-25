'use client';

import { useEffect, useRef, useCallback } from 'react';

interface Props {
  xml: string;
  editable?: boolean;
  onSave?: (xml: string) => void;
  className?: string;
}

const DRAWIO_URL =
  'https://embed.diagrams.net/?embed=1&proto=json&spin=1&noSaveBtn=1&noExitBtn=1&dark=0';

export default function DiagramSlide({ xml, editable = false, onSave, className }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const ready = useRef(false);

  const sendLoad = useCallback(() => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ action: 'load', xml, autosave: editable ? 1 : 0 }),
      '*'
    );
  }, [xml, editable]);

  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (e.source !== iframeRef.current?.contentWindow) return;
      let msg: { event?: string; xml?: string };
      try { msg = typeof e.data === 'string' ? JSON.parse(e.data) : e.data; }
      catch { return; }

      if (msg.event === 'init') {
        ready.current = true;
        sendLoad();
      } else if (msg.event === 'autosave' || msg.event === 'save') {
        if (msg.xml && onSave) onSave(msg.xml);
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [sendLoad, onSave]);

  useEffect(() => {
    if (ready.current) sendLoad();
  }, [sendLoad]);

  return (
    <iframe
      ref={iframeRef}
      src={DRAWIO_URL}
      className={className ?? 'w-full h-full border-0'}
      title="draw.io diagram"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
    />
  );
}
