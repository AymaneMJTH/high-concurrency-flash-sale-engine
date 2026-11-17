const http = require('http');

// Configuration
const TOTAL_REQUESTS = 100;
const CONCURRENT_BATCH_SIZE = 20;
const API_URL = 'http://localhost:3000/flash-sale/checkout';
const API_KEY = process.env.API_KEY || 'your-api-key';

// Statistics
let successful = 0;
let conflicts = 0;
let outOfStock = 0;
let errors = 0;
const startTime = Date.now();

function makeRequest(index) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      productId: 'ddeaaf90-0879-41ec-b717-1ba791486f88',
      quantity: 1,
      customerRef: `customer_${index}`,
      idempotencyKey: `idemp_${index}_${Date.now()}`
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/flash-sale/checkout',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'x-api-key': API_KEY
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          successful++;
        } else if (res.statusCode === 409) {
          conflicts++;
        } else if (res.statusCode === 400) {
          outOfStock++;
        } else {
          errors++;
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      errors++;
      console.error(`Request ${index} error:`, error.message);
      resolve();
    });

    req.write(postData);
    req.end();
  });
}

async function runBatch(batchIndex, startIndex) {
  const promises = [];
  const endIndex = Math.min(startIndex + CONCURRENT_BATCH_SIZE, TOTAL_REQUESTS);

  console.log(`Starting batch ${batchIndex + 1} (requests ${startIndex + 1}-${endIndex})...`);

  for (let i = startIndex; i < endIndex; i++) {
    promises.push(makeRequest(i));
  }

  await Promise.all(promises);
  console.log(`Batch ${batchIndex + 1} completed.`);
}

async function runLoadTest() {
  console.log('=== Flash Sale Load Test ===');
  console.log(`Total requests: ${TOTAL_REQUESTS}`);
  console.log(`Concurrent batch size: ${CONCURRENT_BATCH_SIZE}`);
  console.log(`Target: ${API_URL}`);
  console.log('Starting load test...\n');

  let requestIndex = 0;
  let batchIndex = 0;

  while (requestIndex < TOTAL_REQUESTS) {
    await runBatch(batchIndex, requestIndex);
    requestIndex += CONCURRENT_BATCH_SIZE;
    batchIndex++;
  }

  const endTime = Date.now();
  const totalTime = (endTime - startTime) / 1000; // in seconds
  const avgTimePerRequest = totalTime / TOTAL_REQUESTS * 1000; // in milliseconds

  console.log('\n=== Load Test Summary ===');
  console.log(`Total time: ${totalTime.toFixed(2)}s`);
  console.log(`Average time per request: ${avgTimePerRequest.toFixed(2)}ms`);
  console.log(`Successful checkouts (200/201): ${successful}`);
  console.log(`Conflict errors (409): ${conflicts}`);
  console.log(`Out of stock (400): ${outOfStock}`);
  console.log(`Other errors: ${errors}`);
  console.log(`Total requests: ${successful + conflicts + outOfStock + errors}`);
  console.log('========================');
}

runLoadTest().catch(console.error);
