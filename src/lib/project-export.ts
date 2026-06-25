const PPTX_MIME = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
const DEFAULT_RETENTION_DAYS = 7;

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.floor(n);
}

export function getExportRetentionDays(): number {
  return parsePositiveInt(process.env.PROJECT_EXPORT_RETENTION_DAYS, DEFAULT_RETENTION_DAYS);
}

export function getExportExpiryDate(from = new Date()): Date {
  return new Date(from.getTime() + getExportRetentionDays() * 24 * 60 * 60 * 1000);
}

export function sanitizePptxFileName(title: string | null | undefined): string {
  const base = (title || 'presentation')
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, ' ')
    .slice(0, 80) || 'presentation';
  return `${base}.pptx`;
}

export function trimExportErrorMessage(message: string): string {
  return (message || 'Unknown error').replace(/\s+/g, ' ').trim().slice(0, 500);
}

export function asPptxResponse(data: Uint8Array | Buffer, fileName: string): Response {
  return new Response(new Uint8Array(data), {
    headers: {
      'Content-Type': PPTX_MIME,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
    },
  });
}

export const PROJECT_EXPORT_MIME = PPTX_MIME;
