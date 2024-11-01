const { Queue:QueueMQ, Worker} =  require('bullmq');

// TODO: move to config
const redisOptions = {
  port: 6379,
  host: 'localhost',
  password: '',
  tls: false,
};

 const createQueueMQ = (name) => new QueueMQ(name, { connection: redisOptions });

 const  setupBullMQProcessor=(queueName)=> {
    new Worker(
      queueName,
      async (job) => {
        return { jobId: `This is the return value of job (${job.id})` };
      },
      { connection: redisOptions }
    );
  }

  module.exports ={createQueueMQ,setupBullMQProcessor}
