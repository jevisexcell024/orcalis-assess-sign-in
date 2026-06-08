/**
 * Orcalis Assess — k6 Load Test
 * Run: k6 run tests/load/k6.js
 * Docs: https://k6.io/docs/
 *
 * Stages:
 *   Ramp up to 50 users → sustain → spike to 200 → ramp down
 */
import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5173'

// Custom metrics
const errorRate      = new Rate('errors')
const signinDuration = new Trend('signin_duration', true)
const apiDuration    = new Trend('api_duration', true)

export const options = {
  stages: [
    { duration: '30s', target: 10  },  // warm up
    { duration: '1m',  target: 50  },  // ramp up
    { duration: '2m',  target: 50  },  // sustain
    { duration: '30s', target: 200 },  // spike
    { duration: '1m',  target: 50  },  // recover
    { duration: '30s', target: 0   },  // ramp down
  ],
  thresholds: {
    http_req_duration:     ['p(95)<2000'],  // 95% of requests under 2s
    http_req_failed:       ['rate<0.05'],   // error rate under 5%
    errors:                ['rate<0.05'],
    signin_duration:       ['p(95)<3000'],
    api_duration:          ['p(95)<1000'],
  },
}

export default function () {
  // 1. Health check
  const health = http.get(`${BASE_URL}/api/health`)
  check(health, {
    'health status 200': (r) => r.status === 200,
    'health body ok':    (r) => r.json('status') === 'ok',
  })
  errorRate.add(health.status !== 200)
  apiDuration.add(health.timings.duration)

  sleep(0.5)

  // 2. Version endpoint
  const version = http.get(`${BASE_URL}/api/version`)
  check(version, { 'version 200': (r) => r.status === 200 })
  apiDuration.add(version.timings.duration)

  sleep(0.5)

  // 3. Home page load
  const home = http.get(`${BASE_URL}/home`)
  check(home, {
    'home loads': (r) => r.status === 200,
    'home fast':  (r) => r.timings.duration < 3000,
  })
  errorRate.add(home.status !== 200)

  sleep(0.5)

  // 4. Certificate verification (public)
  const certVerify = http.get(`${BASE_URL}/api/certificates/verify?cert=CERT-TEST1234`)
  check(certVerify, {
    'cert verify responds': (r) => [200, 404].includes(r.status),
  })
  apiDuration.add(certVerify.timings.duration)

  sleep(0.5)

  // 5. Protected routes should return 401
  const protectedRoute = http.get(`${BASE_URL}/api/results/export`)
  check(protectedRoute, {
    'protected returns 401': (r) => r.status === 401,
  })

  sleep(1)
}

export function handleSummary(data) {
  return {
    'tests/load/results.json': JSON.stringify(data, null, 2),
    stdout: `
╔══════════════════════════════════════╗
║   Orcalis Assess Load Test Results   ║
╚══════════════════════════════════════╝

Total requests:  ${data.metrics.http_reqs?.values?.count ?? 0}
Error rate:      ${((data.metrics.http_req_failed?.values?.rate ?? 0) * 100).toFixed(2)}%
p95 duration:    ${data.metrics.http_req_duration?.values?.['p(95)']?.toFixed(0) ?? 'N/A'}ms
p99 duration:    ${data.metrics.http_req_duration?.values?.['p(99)']?.toFixed(0) ?? 'N/A'}ms
`,
  }
}
