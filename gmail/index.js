const express = require('express');
const { google } = require('googleapis');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const port = 3000;

// Google OAuth2 setup
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Scopes for Gmail API
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

// Step 1: Redirect to Google login
app.get('/login', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    // access_type: 'offline', // offline access to get refresh tokens
    scope: SCOPES,
  });
  res.redirect(authUrl);
});

// Step 2: Handle OAuth2 callback and retrieve the tokens
app.get('/oauth2callback', async (req, res) => {
  const { code } = req.query;
  
  // Get tokens
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  // Store the tokens and user's email (if needed) for later use
  // You can store them in a session or database
  res.send('You are authenticated!');
});

// Step 3: Fetch user emails (summary)
app.get('/summarize', async (req, res) => {
  try {
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Fetch user's email list (you can customize this to fetch specific emails)
    const response = await gmail.users.messages.list({
      userId: 'me',
      labelIds: ['INBOX'],
    });
    const msg = await gmail.users.messages.get({
      userId: 'me',
      id: response.data.messages[0].id,
    });
    console.log('msg ',msg)

    const messages = response.data.messages;
    res.json({ messages: messages, msg:msg.data });
  } catch (error) {
    res.status(500).send('Error retrieving emails: ' + error);
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
