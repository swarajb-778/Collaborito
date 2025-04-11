const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

// Serve static files from the proxy-server directory
app.use(express.static(path.join(__dirname, 'proxy-server')));

// Main route to handle the LinkedIn callback
app.get('/auth/linkedin-callback', (req, res) => {
  const { code, state, error, error_description } = req.query;
  
  console.log('Received OAuth callback:', { 
    hasCode: !!code, 
    hasState: !!state, 
    error, 
    error_description 
  });

  // Handle errors
  if (error) {
    return res.send(`
      <html>
        <body>
          <h3>Authentication Error</h3>
          <p>${error}: ${error_description || 'Unknown error'}</p>
          <script>
            setTimeout(() => {
              window.location.href = 'collaborito://auth?error=${error}&error_description=${error_description || ''}';
            }, 1500);
          </script>
        </body>
      </html>
    `);
  }

  // Try to serve our LinkedIn callback page
  const callbackPagePath = path.join(__dirname, 'proxy-server', 'linkedin-callback.html');
  
  if (fs.existsSync(callbackPagePath)) {
    console.log('Serving LinkedIn callback page');
    res.sendFile(callbackPagePath);
  } else {
    // Fallback to inline HTML if the file doesn't exist
    console.log('LinkedIn callback page not found, using fallback');
    
    // Redirect back to the app with the authorization code
    if (code && state) {
      return res.send(`
        <html>
          <body>
            <h3>Authentication Successful</h3>
            <p>Redirecting back to the app...</p>
            <script>
              window.location.href = 'collaborito://auth?code=${code}&state=${state}';
            </script>
          </body>
        </html>
      `);
    }

    // Handle case with missing parameters
    res.send(`
      <html>
        <body>
          <h3>Missing Parameters</h3>
          <p>The authentication response is missing required parameters.</p>
          <script>
            setTimeout(() => {
              window.location.href = 'collaborito://auth?error=missing_params';
            }, 1500);
          </script>
        </body>
      </html>
    `);
  }
});

// Health check route
app.get('/', (req, res) => {
  res.send('OAuth Relay Server is running');
});

app.listen(port, () => {
  console.log(`OAuth Relay Server listening on port ${port}`);
}); 