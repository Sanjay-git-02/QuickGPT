import fs from 'fs';
import path from 'path';
// Prefer the global `fetch` available in modern Node.js. Fall back to `undici` if not present.
const fetch = globalThis.fetch ?? (await import('undici')).fetch;
import Stripe from 'stripe';

function parseEnv(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const lines = text.split(/\r?\n/);
  const env = {};
  for (const line of lines) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
    if (m) {
      const key = m[1];
      let val = m[2];
      // strip surrounding quotes
      if ((val.startsWith("\'") && val.endsWith("\'")) || (val.startsWith('"') && val.endsWith('"'))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  }
  return env;
}

(async ()=>{
  try {
    const envPath = path.resolve(process.cwd(), 'server', '.env');
    const env = parseEnv(envPath);
    const STRIPE_SECRET_KEY = env.STRIPE_SECRET_KEY;
    const STRIPE_WEBHOOK_SECRET_KEY = env.STRIPE_WEBHOOK_SECRET_KEY;
    if (!STRIPE_SECRET_KEY) throw new Error('Missing STRIPE_SECRET_KEY in server/.env');
    if (!STRIPE_WEBHOOK_SECRET_KEY) throw new Error('Missing STRIPE_WEBHOOK_SECRET_KEY in server/.env');

    const base = 'http://localhost:3000';

    console.log('Logging in smoketest user...');
    let r = await fetch(base + '/api/user/login', {method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({email:'smoketest@example.com', password:'password123'})});
    const ld = await r.json();
    const token = ld.token;
    if (!token) throw new Error('Login failed');
    console.log('Logged in, token present');

    console.log('Calling purchase endpoint to create transaction + session...');
    r = await fetch(base + '/api/credits/purchase', {method:'POST', headers:{'content-type':'application/json','authorization':'Bearer '+token,'origin':'http://localhost:5174'}, body: JSON.stringify({planId:'basic'})});
    const pd = await r.json();
    console.log('purchase response', pd);
    const sessionId = pd.sessionId;
    if (!sessionId) throw new Error('No sessionId returned by purchase endpoint');

    const stripe = new Stripe(STRIPE_SECRET_KEY);
    console.log('Retrieving session from Stripe:', sessionId);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log('Session retrieved. id=', session.id, 'metadata=', session.metadata);

    const event = {
      id: 'evt_test_' + Date.now(),
      object: 'event',
      type: 'checkout.session.completed',
      data: { object: session }
    };
    const payload = JSON.stringify(event);
    const header = stripe.webhooks.generateTestHeaderString({ payload, secret: STRIPE_WEBHOOK_SECRET_KEY });

    console.log('Posting signed webhook to /api/stripe');
    const wh = await fetch(base + '/api/stripe', {method:'POST', headers: {'stripe-signature': header, 'content-type':'application/json'}, body: payload});
    console.log('Webhook response status:', wh.status);
    console.log('Webhook response body:', await wh.text());

    console.log('Fetching user data after webhook...');
    const ud = await fetch(base + '/api/user/data', {headers: {'authorization':'Bearer '+token}});
    console.log('User data:', await ud.json());

  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
