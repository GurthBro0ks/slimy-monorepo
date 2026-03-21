/* NUC2 runtime shim — basic queue manager */
class QueueManager {
  constructor() {
    this.queues = new Map();
  }

  createQueue(name, options) {
    this.queues.set(name, { jobs: [], options });
  }

  addJob(queueName, jobData) {
    const queue = this.queues.get(queueName);
    if (queue) {
      queue.jobs.push(jobData);
    }
  }

  processJobs(queueName, processor) {
    const queue = this.queues.get(queueName);
    if (queue && processor) {
      queue.jobs.forEach(job => processor(job));
      queue.jobs = [];
    }
  }

  getQueue(queueName) {
    return this.queues.get(queueName);
  }
}

module.exports = QueueManager;