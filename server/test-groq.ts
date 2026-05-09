import dotenv from 'dotenv';
import { Groq } from 'groq-sdk';

// Load environment variables
dotenv.config();

async function testGroqAPI() {
    console.log('🧪 Testing Groq API...\n');
    
    // Check if API key exists
    const apiKey = process.env.GROQ_API_KEY;
    console.log(`1️⃣  API Key configured: ${apiKey ? '✅ YES' : '❌ NO'}`);
    console.log(`    Key preview: ${apiKey ? apiKey.slice(0, 10) + '...' : 'N/A'}\n`);
    
    if (!apiKey) {
        console.error('❌ GROQ_API_KEY not found in .env!');
        process.exit(1);
    }

    try {
        // Initialize Groq client
        console.log('2️⃣  Initializing Groq client...');
        const client = new Groq({
            apiKey: apiKey
        });
        console.log('    ✅ Client initialized\n');

        // Make a test request
        console.log('3️⃣  Sending test request to Groq API...');
        const response = await client.chat.completions.create({
            messages: [
                {
                    role: 'user',
                    content: 'Say "Hello from Groq!" in one sentence.'
                }
            ],
            model: 'llama-3.3-70b',
            max_tokens: 100
        });

        console.log('✅ Request successful!\n');
        
        // Show response
        console.log('4️⃣  Response from Groq:');
        console.log(`    Model: ${response.model}`);
        if (response.usage) {
            console.log(`    Tokens used: ${response.usage.total_tokens}`);
        }
        console.log(`    Message: ${response.choices[0].message.content}\n`);
        
        console.log('✅ Groq API is working perfectly!');
        process.exit(0);

    } catch (error: any) {
        console.error('\n❌ Groq API Error:');
        console.error(`    Status: ${error.status}`);
        console.error(`    Message: ${error.message}`);
        console.error(`    Type: ${error.type || 'unknown'}`);
        
        if (error.response) {
            console.error(`    Response: ${JSON.stringify(error.response, null, 2)}`);
        }
        
        process.exit(1);
    }
}

testGroqAPI();
