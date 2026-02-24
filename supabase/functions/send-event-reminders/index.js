// Simple worker script to call the process-reminders endpoint
// Usage: set SERVICE_WORKER_SECRET and SITE_ORIGIN env vars, then run periodically (cron)

const fetch = require('node-fetch');

async function main() {
  const secret = process.env.SERVICE_WORKER_SECRET;
  const origin = process.env.SITE_ORIGIN || 'http://localhost:3000';
  const url = `${origin}/api/events/process-reminders`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${secret}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
  });

  const json = await res.json().catch(() => null);
  console.log('process-reminders status', res.status, json);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
