// Helper to get a Firebase ID token for a test user
// Usage: const getTestIdToken = require('./getTestIdToken');
//        const idToken = await getTestIdToken();

const admin = require('firebase-admin');
const path = require('path');

// Use dynamic import for node-fetch to support ESM in CommonJS
let fetch;
async function getFetch() {
  if (!fetch) {
    fetch = (await import('node-fetch')).default;
  }
  return fetch;
}

// Load service account path and API key from environment variables
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || path.join(__dirname, '../service-account-key.json');
const apiKey = process.env.FIREBASE_WEB_API_KEY;

if (!apiKey) {
  throw new Error('FIREBASE_WEB_API_KEY environment variable is required');
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function getTestIdToken(uid = 'testuser') {
  const customToken = await admin.auth().createCustomToken(uid);
  const fetchFn = await getFetch();
  const res = await fetchFn(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: customToken, returnSecureToken: true }),
    }
  );
  const data = await res.json();
  if (!data.idToken) throw new Error('Failed to get ID token: ' + JSON.stringify(data));
  return data.idToken;
}

module.exports = getTestIdToken;
