/**
 * Simple message queue with controlled concurrency.
 * Ported from /opt/slimy/app/lib/queue.js
 */

interface QueueTask {
  fn: () => Promise<unknown>;
  resolve: (value: unknown) => void;
  reject: (err: unknown) => void;
}

function createQueue({ concurrency = 1 }: { concurrency?: number } = {}) {
  const safeConcurrency = Math.max(1, Number(concurrency) || 1);
  let active = 0;
  const pending: QueueTask[] = [];

  function runNext(): void {
    if (active >= safeConcurrency) return;
    const next = pending.shift();
    if (!next) return;
    active += 1;

    Promise.resolve()
      .then(next.fn)
      .then(next.resolve, next.reject)
      .finally(() => {
        active -= 1;
        runNext();
      });
  }

  function enqueue(fn: () => Promise<unknown>): Promise<unknown> {
    return new Promise((resolve, reject) => {
      pending.push({ fn, resolve, reject });
      runNext();
    });
  }

  return {
    enqueue,
    get activeCount() {
      return active;
    },
    get size() {
      return pending.length;
    },
  };
}

const MAX_QUEUE_CONCURRENCY = 2;
const MIN_QUEUE_CONCURRENCY = 1;
const concurrency = Math.min(
  MAX_QUEUE_CONCURRENCY,
  Math.max(
    MIN_QUEUE_CONCURRENCY,
    Number(process.env.MESSAGE_QUEUE_CONCURRENCY) || 2,
  ),
);

const messageQueue = createQueue({ concurrency });

export { messageQueue, createQueue };
export default messageQueue;
