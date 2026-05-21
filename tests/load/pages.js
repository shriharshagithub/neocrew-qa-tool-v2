/**
 * load/pages.js — Page load test
 *
 * Simulates concurrent users hitting the public-facing pages:
 *   - Login page
 *   - Shared report page (public, no auth required)
 *
 * Run:
 *   k6 run tests/load/pages.js --env BASE_URL=https://neocrew-qa-tool-v2.vercel.app --env REPORT_ID=<id>
 *
 * Stages: ramp to 20 VUs over 30s, hold for 1 min, ramp down.
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Rate } from "k6/metrics";

const pageLoad   = new Trend("page_load_ms");
const errorRate  = new Rate("errors");

export const options = {
  stages: [
    { duration: "30s", target: 10 },  // ramp up
    { duration: "1m",  target: 20 },  // hold at 20 concurrent users
    { duration: "30s", target: 0  },  // ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<2000"],  // 95% of requests under 2s
    errors:            ["rate<0.05"],   // error rate under 5%
  },
};

const BASE_URL  = __ENV.BASE_URL  || "https://neocrew-qa-tool-v2.vercel.app";
const REPORT_ID = __ENV.REPORT_ID || "";

export default function () {
  // ── Login page ──
  let res = http.get(`${BASE_URL}/login`);
  pageLoad.add(res.timings.duration);
  errorRate.add(res.status !== 200);
  check(res, {
    "login page 200":           (r) => r.status === 200,
    "login page loads fast":    (r) => r.timings.duration < 2000,
    "contains NeoCrew QA text": (r) => r.body.includes("NeoCrew"),
  });

  sleep(1);

  // ── Shared report page (if REPORT_ID provided) ──
  if (REPORT_ID) {
    res = http.get(`${BASE_URL}/report/${REPORT_ID}`);
    pageLoad.add(res.timings.duration);
    errorRate.add(res.status !== 200);
    check(res, {
      "report page 200":        (r) => r.status === 200,
      "report page loads fast": (r) => r.timings.duration < 2000,
    });
    sleep(1);
  }
}
