const express = require('express');
const router = express.Router();
const { google } = require('googleapis');

const { calenderQueue } = require('../queue/syncCalendar')
const keys = require('../calendar-api-srv-acc.json');

const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
);

// Generate consent URL
router.get('/auth', (req, res) => {
    const scopes = [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
    ];

    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
    });

    res.redirect(url);
});

// Callback to handle Google OAuth response
router.get('/oauth2callback', async (req, res) => {
    const { code } = req.query;
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    res.status(200).send('Authorization successful! You can now share calendars.');
});

const authenticateServiceAccount = async () => {
    const auth = new google.auth.GoogleAuth({
        credentials: keys,
        scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    return auth.getClient(); // Return the authenticated client
};

const listUserCalendars = async (userEmail) => {
    const authClient = await authenticateServiceAccount();
    const calendar = google.calendar({ version: 'v3', auth: authClient });

    try {
        const response = await calendar.calendarList.list({
            minAccessRole: 'writer', // Adjust as necessary
        });
        console.log('Available calendars:', response.data.items);
    } catch (error) {
        console.error('Error listing calendars:', error);
    }
};

router.get('/list', async (req,res) => {
     const cal =await listUserCalendars('arkar20011@gmail.com');

     return res.send(cal)

})
const setupServiceAccountCalendar = async (userEmail) => {
    const auth = new google.auth.GoogleAuth({
        credentials: keys,
        scopes: ['https://www.googleapis.com/auth/calendar'],
    });
    const authClient = await auth.getClient();
    const calendar = google.calendar({ version: 'v3', auth: authClient });

    // Create a new calendar
    const calendarResponse = await calendar.calendars.insert({
        requestBody: {
            summary: 'Shared Service Account Calendar',
        },
    });

    const calendarId = calendarResponse.data.id;
    console.log(`Created calendar with ID: ${calendarId}`);

    // Share calendar with user
    await calendar.acl.insert({
        calendarId: calendarId,
        requestBody: {
            role: 'reader', // Or 'writer' if users should be able to add/edit
            scope: {
                type: 'user',
                value: userEmail,
            },
        },
    });

    console.log(`Shared calendar with ${userEmail}`);
};

router.get('/create-calendar',async(req,res)=>{
    await setupServiceAccountCalendar('arkar20011@gmail.com')

    return res.send('sent')
})
// Sync events from database
router.get('/sync', async (req, res) => {


    const authClient = await authenticateServiceAccount();

    const calendar = google.calendar({ version: 'v3', auth: authClient });

    await calenderQueue.add('my-job', { data: 'example data' });

    // Example event data; replace with your database retrieval
    const event = {
        summary: 'Sample Event',
        start: { dateTime: '2024-11-01T09:00:00-07:00' },
        end: { dateTime: '2024-11-01T10:00:00-07:00' },
    };

    try {
        const response = await calendar.events.insert({
            calendarId: 'arkar20011@gmail.com',
            resource: event,
        });
        res.status(200).send(`Event created: ${response.data.htmlLink}`);
    } catch (error) {
        console.log(error)
        res.status(500).send('Error creating event');
    }
});

const addEventToSharedCalendar = async (calendarId) => {
    const auth = new google.auth.GoogleAuth({
        credentials: keys,
        scopes: ['https://www.googleapis.com/auth/calendar'],
    });
    const authClient = await auth.getClient();
    const calendar = google.calendar({ version: 'v3', auth: authClient });

    try {
        const event = {
            summary: 'Team Meeting',
            start: { dateTime: '2024-11-01T10:00:00-07:00' },
            end: { dateTime: '2024-11-01T11:00:00-07:00' },
        };

        const response = await calendar.events.insert({
            calendarId: calendarId, // ID of the Service Account’s shared calendar
            requestBody: event,
        });
        console.log('Event added successfully:', response.data);
    } catch (error) {
        console.error('Error adding event:', error.response ? error.response.data : error.message);
    }
};

router.get('/share-calendar',async(req,res)=>{
    const event =await addEventToSharedCalendar('9415b2d6a31b268f54bf5726ed8060286db87fc8906823823811d1ec238fbeb1@group.calendar.google.com');

    return res.json('shared')
})

router.get('/add-queue', async (req, res) => {
    const job = await calenderQueue.add('my-job', { data: 'example data' });

    return res.send(`success ${job.id}`);
})

module.exports = router;
