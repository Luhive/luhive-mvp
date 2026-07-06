const timingEnabled = process.env.LOADER_TIMING === "1";

export function logLoaderTiming(label: string, startedAt: number) {
  if (!timingEnabled) return;
  console.info(
    `[loader-timing] ${label}: ${Math.round(performance.now() - startedAt)}ms`,
  );
}

export async function timedLoader<T>(
  label: string,
  promise: PromiseLike<T>,
): Promise<T> {
  if (!timingEnabled) return promise;

  const startedAt = performance.now();
  try {
    return await promise;
  } finally {
    logLoaderTiming(label, startedAt);
  }
}
