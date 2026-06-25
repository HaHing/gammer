type ReleaseFn = () => void;

interface PendingRequest {
  id: number;
  userId: string;
  operation: string;
  enqueuedAt: number;
  queueDepthAtEnqueue: number;
  resolve: (lease: RuntimeLease) => void;
  reject: (error: unknown) => void;
  timer: ReturnType<typeof setTimeout>;
}

export interface RuntimeLease {
  release: ReleaseFn;
  waitMs: number;
  queueDepthAtEnqueue: number;
}

function parseIntEnv(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

const MAX_GLOBAL_CONCURRENCY = parseIntEnv('AI_RUNTIME_MAX_CONCURRENT_GLOBAL', 3, 1, 50);
const MAX_USER_CONCURRENCY = parseIntEnv('AI_RUNTIME_MAX_CONCURRENT_PER_USER', 1, 1, 10);
const QUEUE_TIMEOUT_MS = parseIntEnv('AI_RUNTIME_QUEUE_TIMEOUT_MS', 25000, 1000, 300000);
const MAX_QUEUE_SIZE = parseIntEnv('AI_RUNTIME_MAX_QUEUE_SIZE', 120, 1, 2000);
const MIN_RETRY_AFTER_MS = parseIntEnv('AI_RUNTIME_MIN_RETRY_AFTER_MS', 2000, 500, 60000);
const SLOT_SLICE_MS = parseIntEnv('AI_RUNTIME_SLOT_SLICE_MS', 1800, 200, 10000);

let globalActive = 0;
let reqSeq = 0;
const userActive = new Map<string, number>();
const pending: PendingRequest[] = [];

function getUserActive(userId: string): number {
  return userActive.get(userId) ?? 0;
}

function canRun(userId: string): boolean {
  if (globalActive >= MAX_GLOBAL_CONCURRENCY) return false;
  if (getUserActive(userId) >= MAX_USER_CONCURRENCY) return false;
  return true;
}

function estimateRetryAfterMs(queueDepth: number): number {
  const rounds = Math.ceil(Math.max(1, queueDepth) / Math.max(1, MAX_GLOBAL_CONCURRENCY));
  return Math.max(MIN_RETRY_AFTER_MS, rounds * SLOT_SLICE_MS);
}

function drainQueue(): void {
  if (pending.length === 0) return;

  let progressed = true;
  while (progressed) {
    progressed = false;
    for (let i = 0; i < pending.length; i++) {
      const req = pending[i];
      if (!canRun(req.userId)) continue;

      pending.splice(i, 1);
      clearTimeout(req.timer);
      globalActive += 1;
      userActive.set(req.userId, getUserActive(req.userId) + 1);

      const waitMs = Date.now() - req.enqueuedAt;
      let released = false;
      const release = () => {
        if (released) return;
        released = true;
        globalActive = Math.max(0, globalActive - 1);
        const next = getUserActive(req.userId) - 1;
        if (next <= 0) userActive.delete(req.userId);
        else userActive.set(req.userId, next);
        queueMicrotask(drainQueue);
      };

      req.resolve({
        release,
        waitMs,
        queueDepthAtEnqueue: req.queueDepthAtEnqueue,
      });

      progressed = true;
      break;
    }
  }
}

export class RuntimeThrottleError extends Error {
  status: number;
  code: string;
  retryAfterMs: number;
  queueDepth: number;
  operation: string;

  constructor(operation: string, queueDepth: number, reason: 'queue-full' | 'queue-timeout' = 'queue-full') {
    const retryAfterMs = estimateRetryAfterMs(queueDepth + 1);
    const seconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
    const hint = reason === 'queue-timeout' ? '排队等待超时' : '并发请求过多';
    super(`${hint}，请约 ${seconds} 秒后重试`);
    this.name = 'RuntimeThrottleError';
    this.status = 429;
    this.code = 'RUNTIME_THROTTLED';
    this.retryAfterMs = retryAfterMs;
    this.queueDepth = queueDepth;
    this.operation = operation;
  }
}

export function toThrottlePayload(error: RuntimeThrottleError) {
  return {
    error: error.message,
    code: error.code,
    retryAfterMs: error.retryAfterMs,
    queueDepth: error.queueDepth,
    operation: error.operation,
    retryable: true,
  };
}

export async function acquireRuntimeLease(
  userId: string,
  operation: string,
  timeoutMs = QUEUE_TIMEOUT_MS
): Promise<RuntimeLease> {
  if (!userId) throw new Error('userId is required for runtime lease');
  if (pending.length >= MAX_QUEUE_SIZE) {
    throw new RuntimeThrottleError(operation, pending.length, 'queue-full');
  }

  const queueDepthAtEnqueue = pending.length + 1;
  const enqueuedAt = Date.now();

  return new Promise<RuntimeLease>((resolve, reject) => {
    const requestId = ++reqSeq;
    const timer = setTimeout(() => {
      const idx = pending.findIndex((r) => r.id === requestId);
      if (idx >= 0) {
        pending.splice(idx, 1);
        reject(new RuntimeThrottleError(operation, pending.length, 'queue-timeout'));
      }
    }, timeoutMs);

    pending.push({
      id: requestId,
      userId,
      operation,
      enqueuedAt,
      queueDepthAtEnqueue,
      resolve,
      reject,
      timer,
    });

    drainQueue();
  });
}

export async function withRuntimeLease<T>(
  userId: string,
  operation: string,
  fn: (lease: RuntimeLease) => Promise<T>,
  timeoutMs = QUEUE_TIMEOUT_MS
): Promise<T> {
  const lease = await acquireRuntimeLease(userId, operation, timeoutMs);
  try {
    return await fn(lease);
  } finally {
    lease.release();
  }
}

export function getRuntimeThrottleStats() {
  const activeByUser = [...userActive.values()];
  const maxActiveBySingleUser = activeByUser.length ? Math.max(...activeByUser) : 0;
  return {
    config: {
      maxGlobalConcurrency: MAX_GLOBAL_CONCURRENCY,
      maxUserConcurrency: MAX_USER_CONCURRENCY,
      queueTimeoutMs: QUEUE_TIMEOUT_MS,
      maxQueueSize: MAX_QUEUE_SIZE,
      minRetryAfterMs: MIN_RETRY_AFTER_MS,
      slotSliceMs: SLOT_SLICE_MS,
    },
    runtime: {
      globalActive,
      pending: pending.length,
      activeUsers: userActive.size,
      maxActiveBySingleUser,
    },
  };
}
