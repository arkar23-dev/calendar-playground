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

module.exports = { process, calenderQueue }
