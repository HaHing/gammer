import dns from 'node:dns';

let initialized = false;

export function applyNodeNetworkDefaults(): void {
  if (initialized) return;
  initialized = true;

  const desiredOrder = (process.env.NODE_DNS_RESULT_ORDER || 'ipv4first').toLowerCase();
  if (desiredOrder !== 'ipv4first' && desiredOrder !== 'verbatim') return;

  try {
    dns.setDefaultResultOrder(desiredOrder as 'ipv4first' | 'verbatim');
  } catch {
    // Ignore unsupported runtime/platform cases.
  }
}

