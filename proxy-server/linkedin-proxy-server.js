const express = require('express');
const cors = require('cors');
const app = express();

// Enable CORS
app.use(cors());

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// LinkedIn OAuth callback endpoint
app.get('/auth/linkedin-callback', (req, res) => {
  const { code, state } = req.query;
  
  console.log('Received LinkedIn callback with:', { 
    code: code ? `${code.substring(0, 10)}...` : 'missing', 
    state 
  });
  
  // Redirect to your app with the authorization code and state
  const redirectUrl = `collaborito://auth/linkedin-callback?code=${code}&state=${state}`;
  console.log('Redirecting to:', redirectUrl);
  
  res.redirect(redirectUrl);
});

// Simple status endpoint
app.get('/', (req, res) => {
  res.send('LinkedIn OAuth Proxy is running! Use /auth/linkedin-callback endpoint for OAuth redirects.');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`LinkedIn OAuth proxy server running on port ${PORT}`);
  console.log('To expose with ngrok, run: npx ngrok http 3000');
}); 