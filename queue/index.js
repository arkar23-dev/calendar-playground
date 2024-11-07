const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express');
const { createBullBoard } = require('@bull-board/api');
const { Queue: QueueMQ } = require('bullmq');
const { scheduleJob } =require('./syncCalendar')
const channels = require('./channels')


// TODO: move to config
const redisOptions = {
    port: 6379,
    host: 'localhost',
    password: '',
    tls: false,
  };

const createQueueMQ = (name) => new QueueMQ(name, { connection: redisOptions });

// queue
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/queue');


const setupQueue =async () => {
    channels.forEach(channel => {
        // bull ui board
        createBullBoard({
            queues: [new BullMQAdapter(createQueueMQ(channel.name))],
            serverAdapter,
        });
        channel.process(channel.name)
    });

    // await scheduleJob();

}

module.exports = { setupQueue, serverAdapter};
