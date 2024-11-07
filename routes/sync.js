const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const { calenderQueue } = require('../queue/syncCalendar')
const googleCalendarToken = require('../models/google-calendar-token');
const { oAuth2Client } = require('../google-calendar/index');


// Step 1: Auth URL generation
router.get('/auth', (req, res) => {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/userinfo.email'
        ],
    });
    res.redirect(authUrl);
});

// Step 2: Handle OAuth callback
router.get('/oauth2callback', async (req, res) => {
    try {
        const { code } = req.query;
        const { tokens } = await oAuth2Client.getToken(code);

        oAuth2Client.setCredentials(tokens);

        const oauth2 = google.oauth2({ version: 'v2', auth: oAuth2Client });
        const user = await oauth2.userinfo.get();

        if (user.status === 200) {
            const googleUser = await googleCalendarToken.findOneAndUpdate(
                { googleUserId: user.data.id },
                {
                    email: user.data.email,
                    accessToken: tokens.access_token,
                    refreshToken: tokens.refresh_token,
                    scope: tokens.scope,
                    tokenType: tokens.token_type,
                    expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null
                },
                { upsert: true, new: true }
            );

            console.log(googleUser)
        }


        res.json({
            success: true,
            tokens,
            user
        });
    } catch (error) {
        console.error(error)
        return res.json(error);
    }

});

// create event example
router.get('/create-event', async (req, res) => {
    const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

    await calenderQueue.add('my-job', { data: 'example data' });

    // Example event data; replace with your database retrieval
    const event = {
        summary: 'Sample Event',
        start: { dateTime: '2024-11-01T09:00:00-07:00' },
        end: { dateTime: '2024-11-01T10:00:00-07:00' },
    };

    try {
        const response = await calendar.events.insert({
            calendarId: 'primary',
            resource: event,
        });
        res.status(200).send(`Event created: ${response.data.htmlLink}`);
    } catch (error) {
        console.log(error)
        res.status(500).send('Error creating event');
    }
});

// create batch events
router.get('/create-batch-events', async (req, res) => {
    // get events
    const events = [{
        summary: "Team Meeting",
        location: "Online (Zoom)",
        description: "Discussing project updates and timelines.",
        startDateTime: "2024-11-10T10:00:00-05:00", // ISO 8601 format with timezone
        endDateTime: "2024-11-10T11:00:00-05:00", // ISO 8601 format with timezone
        timeZone: "America/New_York",
    }];

    const chunkSize = 1;

    let page = 0; // Start from the first chunk

    while (true) {

        const users = await googleCalendarToken.find({})
            .skip(page * chunkSize) // Skip the already processed users
            .limit(chunkSize); // Fetch a chunk of users

        if (users.length === 0) {
            break; // Exit the loop when no more users are found
        }

        console.log(users)

        // Add the chunk of users to the BullMQ queue for processing
        await calenderQueue.add('sendCalendarBatchEvent', {
            event: events[0], // Assuming we're adding one event
            users,
        });

        page++;
    }

    return res.send('success');
})
router.get('/add-queue', async (req, res) => {
    const job = await calenderQueue.add('my-job', { data: 'example data' });

    return res.send(`success ${job.id}`);
});

module.exports = router;
