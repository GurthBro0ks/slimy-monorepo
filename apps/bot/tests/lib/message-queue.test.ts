import { createQueue } from '../../src/lib/message-queue';

describe('createQueue', () => {
  it('should process enqueued tasks', async () => {
    const queue = createQueue({ concurrency: 1 });
    const result = await queue.enqueue(() => Promise.resolve(42));
    expect(result).toBe(42);
  });

  it('should process tasks in order with concurrency 1', async () => {
    const queue = createQueue({ concurrency: 1 });
    const order: number[] = [];

    const p1 = queue.enqueue(
      () => new Promise((r) => setTimeout(() => { order.push(1); r(1); }, 20)),
    );
    const p2 = queue.enqueue(
      () => new Promise((r) => setTimeout(() => { order.push(2); r(2); }, 10)),
    );
    const p3 = queue.enqueue(
      () => new Promise((r) => setTimeout(() => { order.push(3); r(3); }, 5)),
    );

    await Promise.all([p1, p2, p3]);
    expect(order).toEqual([1, 2, 3]);
  });

  it('should run tasks concurrently with higher concurrency', async () => {
    const queue = createQueue({ concurrency: 3 });
    const order: number[] = [];

    const p1 = queue.enqueue(
      () => new Promise((r) => setTimeout(() => { order.push(1); r(1); }, 30)),
    );
    const p2 = queue.enqueue(
      () => new Promise((r) => setTimeout(() => { order.push(2); r(2); }, 20)),
    );
    const p3 = queue.enqueue(
      () => new Promise((r) => setTimeout(() => { order.push(3); r(3); }, 10)),
    );

    await Promise.all([p1, p2, p3]);
    expect(order).toEqual([3, 2, 1]);
  });

  it('should propagate task rejections', async () => {
    const queue = createQueue({ concurrency: 1 });
    await expect(
      queue.enqueue(() => Promise.reject(new Error('task failed'))),
    ).rejects.toThrow('task failed');
  });

  it('should report queue size', async () => {
    const queue = createQueue({ concurrency: 1 });
    let resolveTask: (() => void) | null = null;
    queue.enqueue(() => new Promise<void>((r) => { resolveTask = r; }));
    await new Promise((r) => setTimeout(r, 0));
    queue.enqueue(() => Promise.resolve());
    queue.enqueue(() => Promise.resolve());

    expect(queue.size).toBe(2);
    resolveTask!();
  });

  it('should use minimum concurrency of 1', async () => {
    const queue = createQueue({ concurrency: 0 });
    const result = await queue.enqueue(() => Promise.resolve('ok'));
    expect(result).toBe('ok');
  });

  it('should handle NaN concurrency gracefully', async () => {
    const queue = createQueue({ concurrency: NaN });
    const result = await queue.enqueue(() => Promise.resolve('ok'));
    expect(result).toBe('ok');
  });
});
