# 🧪 RAG Testing Guide

## Quick Start Testing

### 1. Start the Server
```bash
cd server
npm install
npm run dev
```

Expected output:
```
✅ MongoDB подключена
🤖 Инициализация RAG Vector Store...
✅ Embedded 20/20 documents...
📊 RAG Vector Store Statistics:
   Total documents: 20
   By category: {"SECURITY": 8, "FINOPS": 5, "OPTIMIZATION": 4, "BEST_PRACTICE": 3}
   By severity: {"CRITICAL": 5, "HIGH": 10, "MEDIUM": 5, "LOW": 0}
✅ RAG готова к использованию!
🚀 Сервер запущен на http://localhost:5000
```

### 2. Test Chat with RAG

**Endpoint**: `POST http://localhost:5000/api/chat/message`

**Request**:
```json
{
  "message": "How do we enable MFA on our AWS account?",
  "sessionId": "test-session-123"
}
```

**Expected Response**:
```json
{
  "message": "To enable MFA on your AWS account, follow these steps:\n\n1. Open the IAM Console...",
  "ragSources": [
    "Enable MFA on AWS Account (CIS 2.1)",
    "MFA Enforcement and Best Practices"
  ]
}
```

---

## Manual RAG Testing

### Test 1: Embedding Generation
```bash
cd server
npx ts-node -O '{"module":"commonjs"}' << 'EOF'
import { generateEmbedding } from './src/embeddings';

(async () => {
  const embedding = await generateEmbedding("How to enable MFA?");
  console.log("Embedding generated:", embedding.length, "dimensions");
  console.log("First 10 values:", embedding.slice(0, 10));
})();
EOF
```

**Expected**: 384-dimensional vector

---

### Test 2: Vector Store Initialization
```typescript
// In a test file: server/src/test-rag.ts
import mongoose from 'mongoose';
import { initializeVectorStore, getVectorStoreStats, retrieveSimilarDocuments } from './vector-store';

async function testRAG() {
  // Connect to MongoDB
  await mongoose.connect('mongodb://localhost:27017/aws_optimizer');
  
  console.log('🔄 Initializing Vector Store...');
  await initializeVectorStore();
  
  console.log('📊 Getting statistics...');
  const stats = await getVectorStoreStats();
  console.log('Stats:', stats);
  
  console.log('🔍 Retrieving similar documents...');
  const docs = await retrieveSimilarDocuments("Enable MFA", 5);
  console.log('Found documents:', docs);
  
  await mongoose.connection.close();
}

testRAG();
```

**Run**:
```bash
npx ts-node -O '{"module":"commonjs"}' server/src/test-rag.ts
```

---

### Test 3: Semantic Search
```typescript
// Query: "Enable MFA"
// Expected: Documents about MFA

// Query: "Save money on EC2"
// Expected: Documents about Reserved Instances, Right-sizing

// Query: "SSH security"
// Expected: Documents about Security Groups, SSH key rotation

// Query: "RDS encryption"
// Expected: Documents about RDS protection
```

---

### Test 4: Hybrid Search
```typescript
import { hybridSearch } from './vector-store';

// Test hybrid search (keyword + semantic)
const results = await hybridSearch("MFA enabled AWS", 5);
// Should combine:
// - Keyword matches: "MFA" + "enabled" + "AWS"
// - Semantic matches: Similar documents
// - Deduplicate and rank by combined score
```

---

### Test 5: AI Recommendations with RAG
```bash
# Test endpoint
curl -X POST http://localhost:5000/api/recommendations \
  -H "Content-Type: application/json" \
  -d '{
    "alerts": [
      {"type": "SECURITY", "severity": "CRITICAL", "message": "MFA not enabled"},
      {"type": "SECURITY", "severity": "HIGH", "message": "SSH access from 0.0.0.0/0"}
    ]
  }'
```

**Expected Response**:
```json
{
  "summary": "Your AWS account has 2 critical security issues...",
  "recommendations": [
    {
      "title": "Enable MFA",
      "description": "...",
      "severity": "CRITICAL",
      "estimatedImpact": "High"
    }
  ],
  "ragSources": [
    "Enable MFA on AWS Account (CIS 2.1)",
    "Restrict Security Group Inbound Rules (CIS 5.1)"
  ]
}
```

---

## Performance Testing

### Measure Embedding Time
```typescript
import { generateEmbedding } from './src/embeddings';

async function testEmbeddingSpeed() {
  const queries = [
    "Enable MFA",
    "Save money on EC2",
    "Fix SSH vulnerability",
    "RDS encryption best practice"
  ];
  
  for (const query of queries) {
    const start = Date.now();
    const embedding = await generateEmbedding(query);
    const duration = Date.now() - start;
    console.log(`"${query}": ${duration}ms`);
  }
}

testEmbeddingSpeed();
```

**Expected**: 10-50ms per embedding

---

### Measure Retrieval Speed
```typescript
import { retrieveSimilarDocuments } from './src/vector-store';

async function testRetrievalSpeed() {
  const queries = ["MFA", "EC2 savings", "SSH", "RDS", "Cost"];
  
  for (const query of queries) {
    const start = Date.now();
    const docs = await retrieveSimilarDocuments(query, 5);
    const duration = Date.now() - start;
    console.log(`"${query}": ${duration}ms - found ${docs.length} docs`);
  }
}

testRetrievalSpeed();
```

**Expected**: 50-100ms per query

---

### Measure Hybrid Search Speed
```typescript
import { hybridSearch } from './src/vector-store';

async function testHybridSearchSpeed() {
  const queries = [
    "Enable MFA security",
    "EC2 cost optimization",
    "SSH key rotation best practices",
    "RDS encryption compliance"
  ];
  
  for (const query of queries) {
    const start = Date.now();
    const docs = await hybridSearch(query, 5);
    const duration = Date.now() - start;
    console.log(`"${query}": ${duration}ms - found ${docs.length} docs`);
  }
}

testHybridSearchSpeed();
```

**Expected**: 100-200ms per hybrid search

---

## Vector Store Statistics

### Check Knowledge Base Coverage
```typescript
import { getVectorStoreStats } from './src/vector-store';

const stats = await getVectorStoreStats();
console.log('Total documents:', stats.totalDocuments);
console.log('By category:');
for (const [category, count] of Object.entries(stats.byCategory)) {
  console.log(`  ${category}: ${count}`);
}
console.log('By severity:');
for (const [severity, count] of Object.entries(stats.bySeverity)) {
  console.log(`  ${severity}: ${count}`);
}
```

**Expected Output**:
```
Total documents: 20
By category:
  SECURITY: 8
  FINOPS: 5
  OPTIMIZATION: 4
  BEST_PRACTICE: 3
By severity:
  CRITICAL: 5
  HIGH: 10
  MEDIUM: 5
  LOW: 0
```

---

## Integration Tests

### Test Security Recommendations with RAG
```json
POST /api/security/recommendations
{
  "securityAlerts": [
    "MFA not enabled",
    "Root account has access keys",
    "SSH from 0.0.0.0/0",
    "RDS publicly accessible",
    "S3 bucket public"
  ]
}
```

**Verify**:
1. Response includes AWS CLI commands
2. ragSources array is populated
3. Recommendations are specific to alerts
4. All recommendations have sources

---

### Test Cost Optimization with RAG
```json
POST /api/cost-optimization/recommendations
{
  "costAlerts": [
    "Underutilized EC2 instances",
    "No Reserved Instances",
    "Large EBS volumes not in use",
    "NAT Gateway high data transfer"
  ]
}
```

**Verify**:
1. Specific savings estimates provided
2. Reserved Instance recommendations
3. Right-sizing suggestions
4. Cost calculation accuracy

---

### Test Chat Conversation with RAG
```json
POST /api/chat/message
{
  "message": "What's our biggest security risk and how do we fix it?",
  "sessionId": "test-user-123",
  "context": {
    "alerts": ["MFA not enabled", "SSH from 0.0.0.0/0"]
  }
}
```

**Verify**:
1. Response addresses specific alerts
2. AWS CLI commands are accurate
3. ragSources lists all retrieved documents
4. Response follows AWS best practices

---

## Debugging

### Check MongoDB Vector Collection
```bash
# Connect to MongoDB
mongo mongodb://localhost:27017/aws_optimizer

# List all vectors
db.vectorembeddings.find().pretty()

# Count vectors
db.vectorembeddings.countDocuments()

# Find specific document
db.vectorembeddings.findOne({ title: "Enable MFA on AWS Account" })

# Check embedding size
db.vectorembeddings.findOne({}, { embedding: { $slice: [0, 5] } })
```

---

### Monitor Logs During RAG Operations
```bash
# Server terminal - watch for:
# ✅ Embedded X/20 documents
# ✅ Vector Store Statistics
# 🔍 Retrieved X similar documents
# ❌ Any RAG errors
```

---

## Expected Test Results

| Test | Expected Result | Pass/Fail |
|------|-----------------|-----------|
| Server starts | Vector Store initialized | ✅ |
| Embedding generation | 384-D vector returned | ✅ |
| Vector retrieval | Documents found & ranked | ✅ |
| Hybrid search | Combined keyword + semantic | ✅ |
| AI recommendations | Includes ragSources array | ✅ |
| Chat with RAG | Sources attributed | ✅ |
| Performance | < 200ms for hybrid search | ✅ |

---

## Troubleshooting Common Issues

### Issue: "RAG инициализация failed"
```
Fix:
1. Check MongoDB is running: mongod
2. Check memory availability
3. Check disk space (need ~100MB free)
4. Restart server with: npm run dev
```

### Issue: "No documents retrieved"
```
Fix:
1. Check similarity threshold (default 0.3)
2. Verify vector store is initialized
3. Check query is in English
4. Try more specific query
```

### Issue: "Embeddings taking too long"
```
Fix:
1. Close other applications (frees memory)
2. Clear browser cache
3. Reduce chat history size
4. Restart server
```

### Issue: "MongoDB connection error"
```
Fix:
1. Start MongoDB: mongod
2. Check connection string in .env
3. Check MongoDB is not already running on same port
4. Restart MongoDB service
```

---

## Final Verification Checklist

- [ ] Server starts without errors
- [ ] Vector Store initializes with all 20 documents
- [ ] Statistics show correct document counts
- [ ] Chat responses include ragSources
- [ ] Retrieval returns relevant documents
- [ ] Hybrid search combines keyword + semantic
- [ ] Embedding generation is < 50ms
- [ ] MongoDB vector collection created
- [ ] No memory leaks during extended testing
- [ ] Graceful degradation if RAG fails

---

**Status**: ✅ Ready to test!

Run `npm run dev` and start testing the RAG system.
