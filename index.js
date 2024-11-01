const express = require('express');
require('dotenv').config();
const { google } = require('googleapis');
const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express');
const { Queue: QueueMQ, Worker } = require('bullmq');

const app = express();
const PORT = 3000;

//queue setup
const createQueueMQ = (name) => new QueueMQ(name, { connection: redisOptions });


const syncQueue = new Bull('sync-events-queue', {
    redis: {
      host: '127.0.0.1', // Update if needed
      port: 6379,
    },
  });




// OAuth2 setup
const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

app.get('/',(req,res)=>{
    return res.json({
        "hello":"world"
    });
})

// Step 1: Auth URL generation
app.get('/auth', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar'],
  });
  res.redirect(authUrl);
});

// Step 2: Handle OAuth callback
app.get('/oauth2callback', async (req, res) => {
  const { code } = req.query;
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  res.send('Authorization successful');
});

// Sync events from database
app.get('/sync', async (req, res) => {
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

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

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
