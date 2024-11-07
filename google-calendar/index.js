const { google } = require('googleapis');
const { OAuth2 } = google.auth;
const BATCH_SIZE = 10; // Number of events to process per batch

// Initialize OAuth2 client
const oAuth2Client = new OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

async function setAuthToken(user) {
    oAuth2Client.setCredentials({ refresh_token: user.refreshToken });
}


// Function to create a batch request for events insertion
async function batchInsertEvents(user, events) {
    const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
    const batch = new google.calendar.BatchRequest();

    // Iterate over each event and add it to the batch
    events.forEach(event => {
      batch.add(calendar.events.insert(
        {
          calendarId: 'primary', // or a specific calendar ID
          resource: event,
        },
        { id: event.id } // Optional ID to map request to response
      ));
    });

    try {
      // Execute the batch request
      const response = await batch.execute();
      console.log(`Batch inserted for user ${user.id}`, response);
    } catch (error) {
      console.error(`Error inserting batch for user ${user.id}: ${error}`);
    }
  }

 // Main function to sync all users
async function syncAllUsers(users, fetchEventsFromDB) {
    for (const user of users) {
      try {
        await setAuthToken(user);
        const events = await fetchEventsFromDB(user.id); // Retrieve events for the user from DB
        await batchInsertEvents(user, events);
      } catch (error) {
        console.error(`Error syncing events for user ${user.id}: ${error}`);
      }
    }
  }

  module.exports ={syncAllUsers,batchInsertEvents,setAuthToken,oAuth2Client}
