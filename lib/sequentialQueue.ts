type TaskFn<T=any> = () => Promise<T>

class SequentialQueue {
  private queue: TaskFn[] = []
  private running = false

  enqueue<T = any>(task: TaskFn<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const wrapped = async () => {
        try {
          const res = await task()
          resolve(res)
        } catch (err) {
          reject(err)
        }
      }

      this.queue.push(wrapped)
      this.runNext()
    })
  }

  private async runNext() {
    if (this.running) return
    const next = this.queue.shift()
    if (!next) return
    this.running = true
    try {
      await next()
    } catch (err) {
      // swallow - callers handled rejection
      console.error('SequentialQueue task error', err)
    } finally {
      this.running = false
      // schedule next microtask to avoid stack recursion
      setTimeout(() => this.runNext(), 0)
    }
  }
}

export const sequentialQueue = new SequentialQueue()
export default sequentialQueue
