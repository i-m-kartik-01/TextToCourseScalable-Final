import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 20,          // 20 concurrent users
  iterations: 20,   // Total 20 requests (one per user)
};

const BASE_URL = 'https://coursegene.shop';

// Paste a valid Auth0 access token here
const TOKEN = 'YOUR_AUTH0_ACCESS_TOKEN';

export default function () {
  const payload = JSON.stringify({
    topic: `Stress Test ${__VU}`
  });

  const params = {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
  };

  const res = http.post(
    `${BASE_URL}/api/courses`,
    payload,
    params
  );

  check(res, {
    'Accepted (202)': (r) => r.status === 202,
  });

  console.log(`VU ${__VU}: ${res.status} -> ${res.body}`);

  sleep(1);
}