function syncLocalAuthUrl(): void {
  if (process.env.NODE_ENV === 'production') return;
  if ((process.env.AUTH_TRUST_HOST || '').toLowerCase() !== 'true') return;

  const runtimePort = (process.env.PORT || '').trim();
  if (!runtimePort) return;

  const configured = (process.env.AUTH_URL || process.env.NEXTAUTH_URL || '').trim();
  const defaultLocal = `http://localhost:${runtimePort}`;

  if (!configured) {
    process.env.AUTH_URL = defaultLocal;
    process.env.NEXTAUTH_URL = defaultLocal;
    return;
  }

  try {
    const parsed = new URL(configured);
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
      parsed.port = runtimePort;
      const normalized = parsed.toString().replace(/\/$/, '');
      process.env.AUTH_URL = normalized;
      process.env.NEXTAUTH_URL = normalized;
    }
  } catch {
    // Keep original value if it is not a valid URL.
  }
}

syncLocalAuthUrl();

export {};
