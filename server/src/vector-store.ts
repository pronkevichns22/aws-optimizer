// ============================================================================
// FILE: vector-store.ts
// LOCATION: server/src/
// PURPOSE: Manage vector embeddings storage in MongoDB
// Provides RAG vector store functionality for retrieval
// ============================================================================

import mongoose from 'mongoose';
import { generateEmbedding, batchCosineSimilarity } from './embeddings';
import { KnowledgeDocument, KNOWLEDGE_BASE } from './knowledge-base';

// ======================== VECTOR STORE SCHEMA ========================
const VectorEmbeddingSchema = new mongoose.Schema(
  {
    documentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: { type: String, required: true },
    content: { type: String, required: true },
    category: {
      type: String,
      enum: ['SECURITY', 'FINOPS', 'OPTIMIZATION', 'BEST_PRACTICE'],
    },
    severity: {
      type: String,
      enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
    },
    embedding: {
      type: [Number], // 384-dimensional vector
      required: true,
      index: false, // MongoDB doesn't have native vector index yet
    },
    tags: [String],
    source: String,
    relatedServices: [String],
    embeddedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// ======================== VECTOR STORE MODEL ========================
export const VectorEmbedding = mongoose.model(
  'VectorEmbedding',
  VectorEmbeddingSchema
);

/**
 * Initialize vector store - load all knowledge base documents into MongoDB
 * Call this once on app startup
 */
export async function initializeVectorStore(): Promise<void> {
  try {
    console.log('🔄 Initializing vector store...');

    // Check if already initialized
    const count = await VectorEmbedding.countDocuments();
    if (count > 0) {
      console.log(`✅ Vector store already initialized with ${count} embeddings`);
      return;
    }

    console.log(`📚 Embedding ${KNOWLEDGE_BASE.length} knowledge base documents...`);

    let successCount = 0;
    let errorCount = 0;

    for (const doc of KNOWLEDGE_BASE) {
      try {
        // Generate embedding for document content + title
        const textToEmbed = `${doc.title}. ${doc.content}`;
        const embedding = await generateEmbedding(textToEmbed);

        // Save to MongoDB
        const vectorDoc = new VectorEmbedding({
          documentId: doc.id,
          title: doc.title,
          content: doc.content,
          category: doc.category,
          severity: doc.severity,
          embedding,
          tags: doc.tags,
          source: doc.source,
          relatedServices: doc.relatedServices,
        });

        await vectorDoc.save();
        successCount++;

        if (successCount % 5 === 0) {
          console.log(`  ✅ Embedded ${successCount}/${KNOWLEDGE_BASE.length} documents...`);
        }
      } catch (error) {
        console.error(`  ❌ Failed to embed document ${doc.id}:`, error);
        errorCount++;
      }
    }

    console.log(
      `✅ Vector store initialized: ${successCount} documents embedded, ${errorCount} errors`
    );
  } catch (error) {
    console.error('❌ Failed to initialize vector store:', error);
    throw error;
  }
}

/**
 * Retrieve similar documents from vector store
 * @param query - Natural language query
 * @param topK - Number of results to return (default 5)
 * @param categoryFilter - Optional category filter
 * @param severityFilter - Optional severity filter
 * @returns Array of matching documents with similarity scores
 */
export async function retrieveSimilarDocuments(
  query: string,
  topK: number = 5,
  categoryFilter?: string,
  severityFilter?: string
): Promise<Array<KnowledgeDocument & { similarity: number }>> {
  try {
    // Generate embedding for query
    const queryEmbedding = await generateEmbedding(query);

    // Build MongoDB filter
    const filter: any = {};
    if (categoryFilter) filter.category = categoryFilter;
    if (severityFilter) filter.severity = severityFilter;

    // Retrieve all relevant documents from MongoDB
    const documents = await VectorEmbedding.find(filter).lean().exec();

    if (documents.length === 0) {
      console.log('⚠️  No documents found in vector store');
      return [];
    }

    // Calculate similarity scores
    const similarities = batchCosineSimilarity(
      queryEmbedding,
      documents.map((doc: any) => doc.embedding)
    );

    // Combine documents with similarity scores and sort
    const results = documents
      .map((doc: any, index: number) => ({
        id: doc.documentId,
        title: doc.title,
        category: doc.category,
        severity: doc.severity,
        content: doc.content,
        tags: doc.tags,
        source: doc.source,
        relatedServices: doc.relatedServices,
        similarity: similarities[index],
      }))
      .filter((doc) => doc.similarity > 0.3) // Only return if similarity > 0.3
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);

    return results;
  } catch (error) {
    console.error('❌ Failed to retrieve similar documents:', error);
    throw error;
  }
}

/**
 * Retrieve documents by keyword (hybrid search)
 * Combines keyword search with semantic similarity
 * @param query - Search query
 * @param topK - Number of results
 * @returns Array of matching documents
 */
export async function hybridSearch(
  query: string,
  topK: number = 5
): Promise<Array<KnowledgeDocument & { similarity: number }>> {
  try {
    // 1. Keyword search
    const keywordResults = await VectorEmbedding.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { tags: { $regex: query, $options: 'i' } },
        { content: { $regex: query, $options: 'i' } },
      ],
    })
      .lean()
      .limit(topK * 2);

    // 2. Semantic search
    const semanticResults = await retrieveSimilarDocuments(query, topK * 2);

    // 3. Combine and deduplicate
    const combined = new Map();

    keywordResults.forEach((doc: any) => {
      combined.set(doc.documentId, {
        id: doc.documentId,
        title: doc.title,
        category: doc.category,
        severity: doc.severity,
        content: doc.content,
        tags: doc.tags,
        source: doc.source,
        relatedServices: doc.relatedServices,
        similarity: 0.5, // Keyword match score
      });
    });

    semanticResults.forEach((doc) => {
      if (combined.has(doc.id)) {
        // Combine scores (average)
        const existing = combined.get(doc.id);
        existing.similarity = (existing.similarity + doc.similarity) / 2;
      } else {
        combined.set(doc.id, doc);
      }
    });

    // Sort by combined score
    return Array.from(combined.values())
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  } catch (error) {
    console.error('❌ Hybrid search failed:', error);
    throw error;
  }
}

/**
 * Get vector store statistics
 */
export async function getVectorStoreStats(): Promise<{
  totalDocuments: number;
  byCategory: Record<string, number>;
  bySeverity: Record<string, number>;
}> {
  try {
    const total = await VectorEmbedding.countDocuments();

    const byCategory = await VectorEmbedding.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
    ]);

    const bySeverity = await VectorEmbedding.aggregate([
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 },
        },
      },
    ]);

    return {
      totalDocuments: total,
      byCategory: Object.fromEntries(
        byCategory.map((doc: any) => [doc._id, doc.count])
      ),
      bySeverity: Object.fromEntries(
        bySeverity.map((doc: any) => [doc._id, doc.count])
      ),
    };
  } catch (error) {
    console.error('❌ Failed to get vector store stats:', error);
    throw error;
  }
}

/**
 * Clear vector store (for testing/reset)
 */
export async function clearVectorStore(): Promise<void> {
  try {
    const result = await VectorEmbedding.deleteMany({});
    console.log(`🗑️  Cleared ${result.deletedCount} embeddings from vector store`);
  } catch (error) {
    console.error('❌ Failed to clear vector store:', error);
    throw error;
  }
}

/**
 * Rebuild vector store from scratch
 */
export async function rebuildVectorStore(): Promise<void> {
  try {
    console.log('🔄 Rebuilding vector store...');
    await clearVectorStore();
    await initializeVectorStore();
    console.log('✅ Vector store rebuilt successfully');
  } catch (error) {
    console.error('❌ Failed to rebuild vector store:', error);
    throw error;
  }
}
