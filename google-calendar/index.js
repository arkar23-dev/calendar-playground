const { google } = require("googleapis");
const { OAuth2 } = google.auth;

// Initialize OAuth2 client
const oAuth2Client = new OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

const sendEventToGoogleCalender = async (user, event) => {
  const calendar = google.calendar({ version: "v3" });

  oAuth2Client.setCredentials({
    access_token: user.accessToken,
    refresh_token: user.refreshToken,
  });

  return calendar.events.insert({
    auth: oAuth2Client,
    calendarId: "primary",
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
};

module.exports = {
  sendEventToGoogleCalender,
  oAuth2Client,
};
