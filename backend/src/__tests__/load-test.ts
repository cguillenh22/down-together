/**
 * Load Testing Script
 * Tests API under concurrent load
 *
 * Usage:
 *   npx ts-node src/__tests__/load-test.ts
 *
 * Configurable:
 *   - Number of concurrent users
 *   - Duration of test
 *   - Endpoints to stress test
 */

import http from 'http';
import { performance } from 'perf_hooks';

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3000';
const CONCURRENT_USERS = 100;
const TEST_DURATION_SECONDS = 60;
const ENDPOINTS = [
  { method: 'GET', path: '/api/qa', weight: 0.3 },
  { method: 'GET', path: '/api/comments/article/health-101', weight: 0.2 },
  { method: 'GET', path: '/api/notifications', weight: 0.2, requiresAuth: true },
  { method: 'POST', path: '/api/activity', weight: 0.15, requiresAuth: true },
  { method: 'GET', path: '/api/bookmarks/user', weight: 0.15, requiresAuth: true },
];

// Metrics
interface Metrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalTime: number;
  responseTimes: number[];
  errors: { [key: string]: number };
}

const metrics: Metrics = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  totalTime: 0,
  responseTimes: [],
  errors: {},
};

// Mock auth token
const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXItMSIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInJvbGUiOiJtZW1iZXIifQ.fake';

interface Endpoint {
  method: string;
  path: string;
  weight: number;
  requiresAuth?: boolean;
}

function selectRandomEndpoint(): Endpoint {
  const random = Math.random();
  let cumulative = 0;

  for (const endpoint of ENDPOINTS) {
    cumulative += endpoint.weight;
    if (random <= cumulative) {
      return endpoint;
    }
  }

  return ENDPOINTS[0];
}

function makeRequest(endpoint: Endpoint): Promise<number> {
  return new Promise((resolve) => {
    const options = {
      hostname: new URL(API_URL).hostname,
      port: new URL(API_URL).port || 3000,
      path: endpoint.path,
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
        ...(endpoint.requiresAuth && { Authorization: `Bearer ${mockToken}` }),
      },
    };

    const startTime = performance.now();

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const responseTime = performance.now() - startTime;
        metrics.responseTimes.push(responseTime);

        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          metrics.successfulRequests++;
        } else {
          metrics.failedRequests++;
          const errorKey = `${res.statusCode}`;
          metrics.errors[errorKey] = (metrics.errors[errorKey] || 0) + 1;
        }

        resolve(responseTime);
      });
    });

    req.on('error', (error) => {
      metrics.failedRequests++;
      metrics.errors[error.message] = (metrics.errors[error.message] || 0) + 1;
      const responseTime = performance.now() - startTime;
      metrics.responseTimes.push(responseTime);
      resolve(responseTime);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      metrics.failedRequests++;
      metrics.errors['TIMEOUT'] = (metrics.errors['TIMEOUT'] || 0) + 1;
      resolve(5000);
    });

    req.end();
  });
}

async function runLoadTest() {
  console.log(`\n🚀 Starting Load Test`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`API URL: ${API_URL}`);
  console.log(`Concurrent Users: ${CONCURRENT_USERS}`);
  console.log(`Duration: ${TEST_DURATION_SECONDS}s`);
  console.log(`Endpoints: ${ENDPOINTS.length}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  const startTime = performance.now();
  const endTime = startTime + TEST_DURATION_SECONDS * 1000;

  // Track progress
  let lastLogTime = startTime;

  async function workerThread() {
    while (performance.now() < endTime) {
      const endpoint = selectRandomEndpoint();
      await makeRequest(endpoint);
      metrics.totalRequests++;

      // Log progress every 10 seconds
      const now = performance.now();
      if (now - lastLogTime > 10000) {
        const elapsed = Math.round((now - startTime) / 1000);
        const rps = Math.round(metrics.totalRequests / ((now - startTime) / 1000));
        console.log(`⏱️  ${elapsed}s | ${metrics.totalRequests} requests | ${rps} req/s`);
        lastLogTime = now;
      }
    }
  }

  // Start concurrent workers
  const workers = Array(CONCURRENT_USERS)
    .fill(null)
    .map(() => workerThread());

  await Promise.all(workers);

  metrics.totalTime = performance.now() - startTime;

  // Calculate statistics
  const avgResponseTime =
    metrics.responseTimes.length > 0
      ? metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length
      : 0;

  const sortedTimes = [...metrics.responseTimes].sort((a, b) => a - b);
  const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)];
  const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
  const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)];
  const maxResponseTime = Math.max(...metrics.responseTimes, 0);

  const successRate = ((metrics.successfulRequests / metrics.totalRequests) * 100).toFixed(2);
  const rps = Math.round(metrics.totalRequests / (metrics.totalTime / 1000));

  // Print results
  console.log(`\n\n📊 Load Test Results`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  console.log(`\n✅ Success Metrics:`);
  console.log(`  Total Requests:        ${metrics.totalRequests}`);
  console.log(`  Successful:            ${metrics.successfulRequests}`);
  console.log(`  Failed:                ${metrics.failedRequests}`);
  console.log(`  Success Rate:          ${successRate}%`);

  console.log(`\n⚡ Performance Metrics:`);
  console.log(`  Total Time:            ${(metrics.totalTime / 1000).toFixed(2)}s`);
  console.log(`  Throughput (RPS):      ${rps} req/s`);
  console.log(`  Avg Response Time:     ${avgResponseTime.toFixed(2)}ms`);
  console.log(`  Min Response Time:     ${Math.min(...metrics.responseTimes).toFixed(2)}ms`);
  console.log(`  Max Response Time:     ${maxResponseTime.toFixed(2)}ms`);
  console.log(`  P50 (Median):          ${p50.toFixed(2)}ms`);
  console.log(`  P95:                   ${p95.toFixed(2)}ms`);
  console.log(`  P99:                   ${p99.toFixed(2)}ms`);

  if (Object.keys(metrics.errors).length > 0) {
    console.log(`\n❌ Errors:`);
    for (const [error, count] of Object.entries(metrics.errors)) {
      console.log(`  ${error}: ${count}`);
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  // Pass/Fail criteria
  const testPassed =
    metrics.successfulRequests / metrics.totalRequests > 0.95 && // >95% success
    avgResponseTime < 200 && // <200ms avg
    p95 < 500; // <500ms p95

  if (testPassed) {
    console.log(`✅ Load test PASSED!\n`);
    process.exit(0);
  } else {
    console.log(`❌ Load test FAILED!\n`);
    console.log(`Target: >95% success, <200ms avg, <500ms p95`);
    console.log(`Actual: ${successRate}% success, ${avgResponseTime.toFixed(2)}ms avg, ${p95.toFixed(2)}ms p95\n`);
    process.exit(1);
  }
}

runLoadTest().catch((error) => {
  console.error('Load test error:', error);
  process.exit(1);
});
