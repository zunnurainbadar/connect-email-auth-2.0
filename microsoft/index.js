require('dotenv').config();
const express = require('express');
const axios = require('axios');
const qs = require('querystring');
const app = express();

// Setup for port and OAuth credentials
const port = 3000;
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const tenantId = process.env.TENANT_ID;
const redirectUri = process.env.REDIRECT_URI;

// Microsoft OAuth 2.0 URLs
const authorizationUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`;
const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
const graphApiUrl = 'https://graph.microsoft.com/v1.0/me/messages';

// Scopes required for reading email
const scopes = 'Mail.Read offline_access';

// Route to start the OAuth flow
app.get('/', (req, res) => {
    res.send('<h1>Welcome to Outlook Email Summarization App!</h1><a href="/login">Login with Outlook</a>');
});

// Route to handle the login redirect
app.get('/login', (req, res) => {
    // Redirect the user to the Microsoft login page
    const authUrl = `${authorizationUrl}?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&response_mode=query&scope=${scopes}`;
    res.redirect(authUrl);
});

// Callback route where Microsoft redirects after login
app.get('/callback', async (req, res) => {
    const code = req.query.code;

    try {
        // Exchange the authorization code for an access token
        const tokenResponse = await axios.post(tokenUrl, qs.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            code: code,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
        }));

        const accessToken = tokenResponse.data.access_token;

        // Fetch emails from Microsoft Graph API
        const emails = await getEmails(accessToken);

        // Summarize the emails
        const emailSummaries = summarizeEmails(emails);

        // Display email summaries
        res.json(emailSummaries);
    } catch (error) {
        console.error('Error exchanging code for token:', error);
        res.status(500).send('An error occurred');
    }
});

// Function to get emails using Microsoft Graph API
async function getEmails(accessToken) {
    try {
        const response = await axios.get(graphApiUrl, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        return response.data.value; // Array of email messages
    } catch (error) {
        console.error('Error fetching emails:', error);
        throw error;
    }
}

// Function to summarize emails (basic example)
function summarizeEmails(emails) {
    return emails.map(email => ({
        subject: email.subject,
        from: email.from.emailAddress.address,
        receivedAt: email.receivedDateTime,
        preview: email.bodyPreview || 'No preview available',
    }));
}

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
