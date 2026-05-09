#!/usr/bin/env node

const http = require('http');

const payload = {
    accessKeyId: 'test',
    secretAccessKey: 'test',
    region: 'us-east-1',
    isLocalStack: true,
    endpoint: 'http://localhost:4566'
};

console.log('📤 Sending POST request to /api/scan...');
console.log('Payload:', JSON.stringify(payload, null, 2));
console.log('');

const data = JSON.stringify(payload);

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/scan',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    console.log(`📥 Response Status: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);
    console.log('');

    let responseData = '';

    res.on('data', (chunk) => {
        responseData += chunk;
    });

    res.on('end', () => {
        try {
            const parsed = JSON.parse(responseData);
            console.log('✅ Response received:');
            console.log(JSON.stringify(parsed, null, 2));
            
            // Show key metrics
            console.log('\n📊 Summary:');
            if (parsed.summary) {
                console.log('  - Total Spend:', parsed.summary.totalSpend);
                console.log('  - Total Waste:', parsed.summary.totalWaste);
                console.log('  - Server Count:', parsed.summary.serverCount);
                console.log('  - Disk Count:', parsed.summary.diskCount);
                console.log('  - IP Count:', parsed.summary.ipCount);
            }
            
            console.log('\n📦 Resources:');
            console.log('  - allResources count:', parsed.allResources?.length || 0);
            console.log('  - resources count:', parsed.resources?.length || 0);
            
            if (parsed.allResources?.length > 0) {
                console.log('\n🎯 First resource:');
                console.log(JSON.stringify(parsed.allResources[0], null, 2));
            }
        } catch (err) {
            console.error('❌ Failed to parse response:', err.message);
            console.log('Raw response:', responseData);
        }
    });
});

req.on('error', (error) => {
    console.error('❌ Error:', error.message);
});

req.write(data);
req.end();

console.log('⏳ Waiting for response...\n');
