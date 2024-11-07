const { Queue, Worker } = require('bullmq');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// TODO: move to config
const redisOptions = {
    port: 6379,
    host: 'localhost',
    password: '',
    tls: false,
};

const process = (queueName) => {
    return new Worker(
        queueName,
        async (job) => {

            await sleep(5000);

            return { jobId: `This is the return value of job (${job.id})` };
        },
        { connection: redisOptions }
    );
}

const calenderQueue = new Queue('calenderEvents');

const scheduleJob =async ()=>{

// Upserting a job with a cron expression
await calenderQueue.upsertJobScheduler(
    'schedular-job',
    {
        every: 10000, // Job will repeat every 10000 milliseconds (10 seconds)
      },
    {
      name: 'cron-job',
      data: { jobData: 'morning data' },
      opts: {}, // Optional additional job options
    },
  );
}

module.exports = { process, calenderQueue,scheduleJob }
