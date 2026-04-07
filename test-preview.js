// Test script for preview API
const http = require('http');
const fs = require('fs');

const data = JSON.stringify({
  topic: "2024年中国云计算市场分析",
  description: "分析市场现状和竞争格局",
  pageCount: 5,
  theme: "google",
  scenes: "技术方案评审"
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/preview',
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
  timeout: 300000,
};

console.log('Starting preview request...');
const startTime = Date.now();

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\nCompleted in ${elapsed}s, status: ${res.statusCode}`);
    fs.writeFileSync('/tmp/gammer-preview.json', body);
    try {
      const result = JSON.parse(body);
      if (result.error) {
        console.log('ERROR:', result.error);
      } else {
        console.log(`Slides: ${result.slides?.length}`);
        console.log(`Score: ${result.score}`);
        console.log(`Issues: ${result.issues?.length}`);
        console.log(`Research stats: ${result.research?.keyStats?.length}`);
        if (result.slides) {
          result.slides.forEach((s, i) => {
            const img = s.imageUrl ? '🖼' : (s.needsImage ? '📷' : '  ');
            const m = (s.keyMetrics || []).length;
            const c = (s.chartData || []).length;
            const b = (s.bullets || []).length;
            console.log(`  ${i+1}. [${s.type}] [${s.layout}] ${img} M:${m} C:${c} B:${b} | ${s.title?.substring(0,40)}`);
          });
        }
      }
    } catch (e) {
      console.log('Parse error:', e.message);
      console.log('Body:', body.substring(0, 500));
    }
  });
});

req.on('timeout', () => { console.log('Request timed out'); req.destroy(); });
req.on('error', (e) => { console.log('Error:', e.message); });
req.write(data);
req.end();
