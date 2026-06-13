// ============================================================================
// FILE: embeddings.ts
// LOCATION: server/src/
// PURPOSE: Generate and manage embeddings for RAG (Retrieval Augmented Generation)
// Uses @xenova/transformers for local embedding generation (no external API)
// ============================================================================

import { env, pipeline, Tensor, transformers } from '@xenova/transformers';

// Use local models (downloads once, then cached)
env.allowLocalModels = true;
env.allowRemoteModels = false;

let embeddingPipeline: any = null;

/**
 * Initialize embedding pipeline (lazy loading)
 * Uses MiniLM-L6-v2 (33MB, fast, good for semantic search)
 */
async function getEmbeddingPipeline() {
  if (!embeddingPipeline) {
    console.log('🔄 Initializing embedding pipeline (first time only, downloads ~33MB)...');
    try {
      embeddingPipeline = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2' // Fast, 33MB model, good for semantic search
      );
      console.log('✅ Embedding pipeline initialized');
    } catch (error) {
      console.error('❌ Failed to initialize embedding pipeline:', error);
      throw new Error('Embedding pipeline initialization failed');
    }
  }
  return embeddingPipeline;
}

/**
 * Generate embedding vector for a text string
 * Returns a 384-dimensional vector
 * @param text - Text to embed
 * @returns Array of numbers (384-dim vector)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const pipeline = await getEmbeddingPipeline();
    
    // Generate embedding
    const result = await pipeline(text, { pooling: 'mean', normalize: true });
    
    // Convert to array of numbers
    const embedding = Array.from(result.data);
    
    return embedding;
  } catch (error) {
    console.error('❌ Failed to generate embedding:', error);
    throw new Error(`Embedding generation failed: ${error}`);
  }
}

/**
 * Generate embeddings for multiple texts
 * @param texts - Array of texts to embed
 * @returns Array of embedding vectors
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    const embeddings: number[][] = [];
    
    for (const text of texts) {
      const embedding = await generateEmbedding(text);
      embeddings.push(embedding);
    }
    
    return embeddings;
  } catch (error) {
    console.error('❌ Failed to generate embeddings:', error);
    throw new Error(`Embeddings generation failed: ${error}`);
  }
}

/**
 * Calculate cosine similarity between two embedding vectors
 * Returns value between -1 and 1 (higher = more similar)
 * @param vec1 - First embedding vector
 * @param vec2 - Second embedding vector
 * @returns Similarity score (0 to 1)
 */
export function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) {
    throw new Error('Vectors must have same dimension');
  }

  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    mag1 += vec1[i] * vec1[i];
    mag2 += vec2[i] * vec2[i];
  }

  mag1 = Math.sqrt(mag1);
  mag2 = Math.sqrt(mag2);

  if (mag1 === 0 || mag2 === 0) {
    return 0;
  }

  return dotProduct / (mag1 * mag2);
}

/**
 * Batch calculate cosine similarity
 * Efficient for comparing one query vector against many document vectors
 * @param queryEmbedding - Query embedding vector
 * @param documentEmbeddings - Array of document embedding vectors
 * @returns Array of similarity scores in same order
 */
export function batchCosineSimilarity(
  queryEmbedding: number[],
  documentEmbeddings: number[][]
): number[] {
  return documentEmbeddings.map((docEmbedding) =>
    cosineSimilarity(queryEmbedding, docEmbedding)
  );
}

/**
 * Information about embedding model
 */
export const EMBEDDING_MODEL_INFO = {
  name: 'Xenova/all-MiniLM-L6-v2',
  dimension: 384,
  description: 'Fast semantic similarity model (33MB)',
  downloadSize: '33MB',
  inferenceTime: '10-50ms per text',
  accuracy: 'Good for semantic search',
  languages: 'English',
  maxTokens: 512,
};

/**
 * Test embedding functionality
 */
export async function testEmbeddings(): Promise<void> {
  console.log('🧪 Testing embeddings...');
  
  try {
    const texts = [
      'Enable MFA for AWS account security',
      'Use Reserved Instances for cost savings',
      'Configure VPC Flow Logs for network monitoring',
    ];

    console.log('📝 Generating embeddings for test texts...');
    const embeddings = await generateEmbeddings(texts);
    
    console.log(`✅ Generated ${embeddings.length} embeddings`);
    console.log(`   Each embedding is ${embeddings[0].length}-dimensional`);

    // Test similarity
    console.log('📊 Testing cosine similarity...');
    const similarity = cosineSimilarity(embeddings[0], embeddings[1]);
    console.log(`   Similarity between first two texts: ${similarity.toFixed(4)}`);

    console.log('✅ Embeddings test passed!');
  } catch (error) {
    console.error('❌ Embeddings test failed:', error);
  }
}
