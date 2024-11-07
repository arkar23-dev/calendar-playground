const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const { calenderQueue } = require('../queue/syncCalendar')
const googleCalendarToken = require('../models/google-calendar-token');

// OAuth2 setup
const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
);

// Step 1: Auth URL generation
router.get('/auth', (req, res) => {
    const authUrl = oauth2Client.generateAuthUrl({
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
        const { tokens } = await oauth2Client.getToken(code);

        oauth2Client.setCredentials(tokens);

        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const user = await oauth2.userinfo.get();

        if (user.status === 200) {

            googleCalendarToken.findOneAndUpdate(
                { googleUserId: user.data.id },
                {
                    googleUserId: user.data.id,
                    email: user.data.email,
                    accessToken: tokens.access_token,
                    refreshToken: tokens.refresh_token,
                    scope: tokens.scope,
                    tokenType: tokens.token_type,
                    expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null
                },
                { upsert: true, new: true }
            );
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
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

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
router.get('/create-batch-events',async(req,res)=>{
    return res.json('hello world')
})
router.get('/add-queue', async (req, res) => {
    const job = await calenderQueue.add('my-job', { data: 'example data' });

    return res.send(`success ${job.id}`);
});

module.exports = router;
