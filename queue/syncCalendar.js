const { Queue, Worker } = require('bullmq');
const { oAuth2Client } = require('../google-calendar/index');
const { google } = require('googleapis');

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
            try {
                const { events, user } = job.data;
                const calendar = google.calendar({ version: 'v3' });

                // Loop over the chunk of events
                events.forEach(event => {
                    job.log(`Processing event: ${event.summary}`);
                    job.log(`Processing user: ${user.email}`);

                    try {
                        oAuth2Client.setCredentials({
                            access_token: user.accessToken,
                            refresh_token: user.refreshToken,
                        });


                         calendar.events.insert({
                            auth: oAuth2Client,
                            calendarId: 'primary',
                            requestBody: {
                                summary: event.summary,
                                location: event.location,
                                description: event.description,
                                start: {
                                    dateTime: event.startDateTime,
                                    timeZone: event.timeZone,
                                },
                                end: {
                                    dateTime: event.endDateTime,
                                    timeZone: event.timeZone,
                                },
                            },
                        });
                        job.log(`Event successfully added for user: ${user.email}`);
                    } catch (error) {
                        job.log(`Error Adding Event: ${event.summary}`);
                        throw  error;
                    }
                });
                return { success: true };

            } catch (err) {
                console.error('Error executing batch request', err);
            }


        },
        { connection: redisOptions }
    );
}

const calenderQueue = new Queue('calenderEvents');

const scheduleJob = async () => {

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

module.exports = { process, calenderQueue, scheduleJob }
