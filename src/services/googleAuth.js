let googleToken = null;
let tokenClient = null;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google script'));
    document.head.appendChild(script);
  });
}

export async function initGoogleAuth() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '1001651401019-atu872iborp1po0885gts8gkp8mlpmkg.apps.googleusercontent.com';
  await loadScript('https://accounts.google.com/gsi/client');
  if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
    throw new Error('Google Identity Services not available');
  }
  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
    callback: (resp) => {
      // handled per request
    },
  });
}

export async function requestGoogleToken() {
  if (!tokenClient) {
    await initGoogleAuth();
  }
  return new Promise((resolve, reject) => {
    try {
      tokenClient.callback = (resp) => {
        if (resp && resp.access_token) {
          googleToken = resp.access_token;
          resolve(googleToken);
        } else {
          reject(new Error('No access token received'));
        }
      };
      tokenClient.requestAccessToken({ prompt: googleToken ? '' : 'consent' });
    } catch (e) {
      reject(e);
    }
  });
}

export function getGoogleToken() {
  return googleToken;
}

export function clearGoogleToken() {
  googleToken = null;
}



