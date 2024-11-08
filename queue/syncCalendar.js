const { Queue, Worker } = require("bullmq");
const { sendEventToGoogleCalender } = require("../google-calendar/index");
const { google } = require("googleapis");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// TODO: move to config
const redisOptions = {
  port: 6379,
  host: "localhost",
  password: "",
  tls: false,
};

const syncBatchEventsWithUser = async (job) => {
  try {
    const { events, user } = job.data;

    // Loop over the chunk of events
    for (let event of events) {
      job.log(`Processing event: ${event.summary}`);
      job.log(`Processing user: ${user.email}`);

      try {
        await sendEventToGoogleCalender(user, event);
        job.log(`Event successfully added for user: ${user.email}`);
      } catch (error) {
        job.log(`Event failed to added for user: ${user.email}`);
        throw error;
      }
    }

    return { success: true };
  } catch (err) {
    console.error("Error executing batch request", err);
  }
};

const sendEventToBatchUsers = async (job) => {
  try {
    const { event, users } = job.data;
    // Loop over the chunk of events
    for (let user of users) {
      job.log(`Processing event: ${event.summary}`);
      job.log(`Processing user: ${user.email}`);

      try {
        await sendEventToGoogleCalender(user, event);
        job.log(`Event successfully added for user: ${user.email}`);
      } catch (error) {
        job.log(`Event failed to added for user: ${user.email}`);
        throw error;
      }
    }

    return { success: true };
  } catch (err) {
    console.error("Error executing batch request", err);
  }
};

const process = (queueName) => {
  return new Worker(
    queueName,
    async (job) => {
      if (job.name === "syncBatchEventsWithUser") {
        await syncBatchEventsWithUser(job);
      }
      if (job.name === "sendEventToBatchUsers") {
        await sendEventToBatchUsers(job);
      }
    },
    {
      connection: redisOptions,
      limiter: {
        max: 1,
      },
      concurrency: 5,
    }
  );
};

const calenderQueue = new Queue("calenderEvents");

const scheduleJob = async () => {
  // Upserting a job with a cron expression
  await calenderQueue.upsertJobScheduler(
    "schedular-job",
    {
      every: 10000, // Job will repeat every 10000 milliseconds (10 seconds)
    },
    {
      name: "cron-job",
      data: { jobData: "morning data" },
      opts: {}, // Optional additional job options
    }
  );
};

module.exports = { process, calenderQueue, scheduleJob };
