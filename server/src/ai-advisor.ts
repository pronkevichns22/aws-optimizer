// ============================================================================
// FILE: ai-advisor.ts
// LOCATION: server/src/
// PURPOSE: Groq AI integration with RAG for AWS optimization recommendations
// FEATURES: RAG-enhanced analysis, alerts processing, and actionable recommendations
// ============================================================================

import { Groq } from 'groq-sdk';
import { retrieveSimilarDocuments, hybridSearch } from './vector-store';

// ========== AI ADVISOR CONFIGURATION - MAXIMUM LIMITS ==========
const AI_CONFIG = {
  MAX_ALERTS_ANALYZE: 10,        // Process top 10 alerts only
  MAX_RECOMMENDATIONS: 4,         // Return max 4 recommendations
  MAX_TOKENS_MAIN: 512,           // Tokens for main recommendations
  MAX_TOKENS_SECURITY: 256,       // Tokens for security recommendations
  MAX_TOKENS_COST: 256,           // Tokens for cost recommendations
  MAX_TOKENS_CHAT: 1024,          // Tokens for chat responses (increased for detailed answers with AWS CLI)
  TEMPERATURE_FOCUSED: 0.2,       // Very low temp for precise, deterministic answers
  MAX_ALERTS_SECURITY: 8,         // Max security alerts to analyze
  MAX_ALERTS_COST: 8,             // Max cost alerts to analyze
  MAX_CHAT_HISTORY_MESSAGES: 12,   // Context window: last 6 exchanges (user + assistant pairs)
  RAG_TOP_K: 5,                   // Number of knowledge base documents to retrieve
  RAG_SIMILARITY_THRESHOLD: 0.3,  // Minimum similarity score for RAG results
} as const;

let groq: Groq | null = null;

// Initialize Groq client lazily (after environment variables are loaded)
function getGroqClient(): Groq {
  if (!groq) {
    const apiKey = process.env.GROQ_API_KEY?.trim();
    console.log('🔐 Initializing Groq client...');
    console.log(`   API Key present: ${apiKey ? 'YES' : 'NO'}`);
    console.log(`   Key length: ${apiKey?.length}`);
    console.log(`   Key preview: ${apiKey ? apiKey.slice(0, 10) + '...' + apiKey.slice(-5) : 'MISSING'}`);
    
    if (!apiKey) {
      throw new Error('GROQ_API_KEY is not set in environment variables');
    }
    groq = new Groq({
      apiKey,
    });
    console.log('   ✅ Groq client initialized successfully');
  }
  return groq;
}

export interface Alert {
  id: string;
  type: 'SECURITY' | 'FINOPS';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'WARNING' | 'INFO';
  title: string;
  description: string;
  resourceId: string;
}

export interface AIRecommendation {
  summary: string;
  recommendations: string[];
  estimatedSavings?: string;
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  ragSources?: string[]; // Track which knowledge base docs were used
}

/**
 * Build RAG context from knowledge base
 * Retrieves relevant AWS best practices based on alerts
 * @param alerts - Array of alerts to analyze
 * @param topK - Number of documents to retrieve
 * @returns Formatted context string for LLM
 */
async function buildRAGContext(alerts: Alert[], topK: number = 5): Promise<{
  context: string;
  sources: string[];
}> {
  try {
    if (alerts.length === 0) {
      return { context: '', sources: [] };
    }

    // Create search queries from alerts
    const searchQueries = alerts
      .slice(0, 3)
      .map((a) => `${a.title} ${a.description}`)
      .join(' | ');

    // Retrieve relevant documents from knowledge base
    const similarDocs = await hybridSearch(searchQueries, topK);

    if (similarDocs.length === 0) {
      console.log('⚠️  No relevant knowledge base documents found for RAG');
      return { context: '', sources: [] };
    }

    // Format retrieved documents as context
    const ragContext = similarDocs
      .map(
        (doc, index) =>
          `[DOC ${index + 1}] ${doc.title} (${doc.severity})
Source: ${doc.source}
Content: ${doc.content.substring(0, 300)}...
Similarity: ${(doc.similarity * 100).toFixed(1)}%`
      )
      .join('\n\n');

    const sources = similarDocs.map((doc) => `${doc.title} (${doc.source})`);

    return {
      context: ragContext,
      sources,
    };
  } catch (error) {
    console.error('❌ Failed to build RAG context:', error);
    return { context: '', sources: [] };
  }
}

/**
 * Get AI recommendations based on alerts (with RAG)
 * Uses Groq API to analyze top alerts and provide actionable recommendations
 * Enhanced with RAG to reference AWS best practices knowledge base
 * @param alerts - Array of alerts to analyze
 * @param detailed - If true, provide detailed recommendations; if false, provide brief summary only
 */
export async function getAIRecommendations(
  alerts: Alert[],
  detailed: boolean = false
): Promise<AIRecommendation> {
  if (alerts.length === 0) {
    return {
      summary: 'No alerts to analyze',
      recommendations: [],
      priority: 'LOW',
      ragSources: [],
    };
  }

  // Group alerts by severity
  const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL').length;
  const highCount = alerts.filter((a) => a.severity === 'HIGH').length;
  const mediumCount = alerts.filter((a) => a.severity === 'MEDIUM').length;

  // Create alert summary for AI analysis - limit to top 10 alerts
  const alertSummary = alerts
    .slice(0, AI_CONFIG.MAX_ALERTS_ANALYZE)
    .map(
      (a) =>
        `[${a.severity}] ${a.title} (${a.type}): ${a.description}`
    )
    .join('\n');

  // 🚀 RAG ENHANCEMENT: Retrieve relevant AWS best practices
  const { context: ragContext, sources: ragSources } = await buildRAGContext(
    alerts,
    AI_CONFIG.RAG_TOP_K
  );

  const ragContextBlock = ragContext
    ? `\n\n📚 RELEVANT AWS BEST PRACTICES FROM KNOWLEDGE BASE:\n${ragContext}\n\nUse these practices to inform your recommendations.`
    : '';

  const briefPrompt = `You are an AWS expert AI created by Nikita for AWS Optimizer platform.

YOUR SYSTEM CAN:
✓ Display Security alerts + recommendations
✓ Show all AWS resources (EC2, EBS, IPs, RDS)
✓ Track costs and spending
✓ Scan infrastructure
✓ Export PDF reports
✓ Configure AWS credentials/regions

YOUR SYSTEM CANNOT:
✗ Automatically fix issues (manual action required)
✗ Create/modify AWS resources
✗ Execute AWS CLI commands

If asked who created you: "I was created by Nikita"

Analyze these alerts briefly (1-2 sentences):

${alertSummary}
${ragContextBlock}

RESPOND IN JSON ONLY - ONLY recommend what system CAN do:
{
  "summary": "1-2 sentences mentioning actionable steps",
  "recommendations": ["Use page X to...", "See report for..."],
  "priority": "URGENT|HIGH|MEDIUM|LOW"
}`;

  const detailedPrompt = `You are an AWS expert AI created by Nikita for AWS Optimizer platform with access to AWS best practices knowledge base.

YOUR SYSTEM CAN:
✓ Display Security alerts with detailed recommendations
✓ Show/filter EC2, EBS, Elastic IPs, RDS resources
✓ Track costs, trends, health score
✓ Generate and export PDF reports
✓ Rescan infrastructure
✓ Store scan history/logs
✓ Configure AWS regions and credentials

YOUR SYSTEM CANNOT:
✗ Automatically delete/modify AWS resources
✗ Execute AWS CLI commands
✗ Create security groups or change configs
✗ Deploy infrastructure

If asked who created you: "I was created by Nikita"

Analyze these alerts - provide actionable steps based on AWS best practices:

${alertSummary}
${ragContextBlock}

RESPOND IN JSON ONLY:
{
  "summary": "2-3 sentences about what to do IN YOUR SYSTEM",
  "recommendations": ["Go to X page to Y", "Review Z in report"],
  "estimatedSavings": "$XXX/month or TBD",
  "priority": "URGENT|HIGH|MEDIUM|LOW"
}

Rules: Only recommend your system's features. Reference best practices. Plain text.`;

  const prompt = detailed ? detailedPrompt : briefPrompt;

  const message = await getGroqClient().chat.completions.create({
    model: 'llama-3.1-8b-instant',
    max_tokens: detailed ? AI_CONFIG.MAX_TOKENS_MAIN : 200,
    temperature: AI_CONFIG.TEMPERATURE_FOCUSED,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  // Extract text response
  const content = message.choices[0].message.content || '{}';

  try {
    // Try to extract JSON from the response (in case there's extra text)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : content;
    const parsed = JSON.parse(jsonStr);

    // Determine priority based on alert severity
    let priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
    if (criticalCount > 0) priority = 'URGENT';
    else if (highCount > 3) priority = 'HIGH';
    else if (mediumCount > 5) priority = 'MEDIUM';
    else priority = 'LOW';

    return {
      summary:
        parsed.summary ||
        `Found ${alerts.length} issues: ${criticalCount} CRITICAL, ${highCount} HIGH, ${mediumCount} MEDIUM`,
      recommendations: Array.isArray(parsed.recommendations)
        ? parsed.recommendations.slice(0, detailed ? AI_CONFIG.MAX_RECOMMENDATIONS : 1)
        : [],
      estimatedSavings: detailed ? parsed.estimatedSavings : undefined,
      priority,
      ragSources: ragSources.slice(0, 3), // Include top 3 sources
    };
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    console.error('Raw content:', content);
    
    if (detailed) {
      return {
        summary: `Analyzed ${alerts.length} AWS alerts. Review dashboard for details.`,
        recommendations: [
          'Review critical security findings',
          'Identify unused resources for deletion',
          'Optimize instance types for cost',
        ],
        priority: criticalCount > 0 ? 'URGENT' : 'HIGH',
        ragSources,
      };
    } else {
      return {
        summary: `${alerts.length} issues found. Click button for details.`,
        recommendations: ['View details in Security tab'],
        priority: criticalCount > 0 ? 'URGENT' : 'HIGH',
        ragSources,
      };
    }
  }
}

/**
 * Generate security-focused recommendations (with RAG)
 */
export async function getSecurityRecommendations(
  securityAlerts: Alert[]
): Promise<{ text: string; ragSources: string[] }> {
  if (securityAlerts.length === 0) {
    return {
      text: 'No security issues detected. Your infrastructure is secure.',
      ragSources: [],
    };
  }

  const alertSummary = securityAlerts
    .slice(0, AI_CONFIG.MAX_ALERTS_SECURITY)
    .map((a) => `- ${a.title}: ${a.description}`)
    .join('\n');

  // 🚀 RAG: Get security best practices
  const { context: ragContext, sources: ragSources } = await buildRAGContext(
    securityAlerts.filter((a) => a.type === 'SECURITY'),
    AI_CONFIG.RAG_TOP_K
  );

  const message = await getGroqClient().chat.completions.create({
    model: 'llama-3.1-8b-instant',
    max_tokens: AI_CONFIG.MAX_TOKENS_SECURITY,
    temperature: AI_CONFIG.TEMPERATURE_FOCUSED,
    messages: [
      {
        role: 'user',
        content: `As a security expert, provide 3 critical security fixes for these issues:

${alertSummary}

${ragContext ? `\nReference these AWS security best practices:\n${ragContext}` : ''}

Format: Numbered list (1. 2. 3.). Each fix max 1 line. Be actionable. NO MARKDOWN - use plain text only.`,
      },
    ],
  });

  return {
    text: message.choices[0].message.content || '',
    ragSources: ragSources.slice(0, 2),
  };
}

/**
 * Generate cost optimization recommendations (with RAG)
 */
export async function getCostOptimizationRecommendations(
  costAlerts: Alert[]
): Promise<{ text: string; ragSources: string[] }> {
  if (costAlerts.length === 0) {
    return {
      text: 'Your infrastructure is optimized for cost. No major savings opportunities found.',
      ragSources: [],
    };
  }

  const alertSummary = costAlerts
    .slice(0, AI_CONFIG.MAX_ALERTS_COST)
    .map((a) => `- ${a.title}: ${a.description}`)
    .join('\n');

  // 🚀 RAG: Get FinOps best practices
  const { context: ragContext, sources: ragSources } = await buildRAGContext(
    costAlerts.filter((a) => a.type === 'FINOPS'),
    AI_CONFIG.RAG_TOP_K
  );

  const message = await getGroqClient().chat.completions.create({
    model: 'llama-3.1-8b-instant',
    max_tokens: AI_CONFIG.MAX_TOKENS_COST,
    temperature: AI_CONFIG.TEMPERATURE_FOCUSED,
    messages: [
      {
        role: 'user',
        content: `Cost optimization specialist: Provide 3 ways to reduce costs:

${alertSummary}

${ragContext ? `\nReference these FinOps best practices:\n${ragContext}` : ''}

Format: Numbered list (1. 2. 3.). Each action max 1 line. Include estimated savings. NO MARKDOWN - use plain text only.`,
      },
    ],
  });

  return {
    text: message.choices[0].message.content || '',
    ragSources: ragSources.slice(0, 2),
  };
}

/**
 * Handle user messages and questions about their infrastructure (with RAG)
 */
export async function getUserAIResponse(
  userMessage: string,
  context?: {
    alerts?: Alert[];
    resourceCount?: number;
    totalCost?: number;
    chatHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  }
): Promise<{ text: string; ragSources: string[] }> {
  if (!userMessage.trim()) {
    return {
      text: 'Ask about your infrastructure.',
      ragSources: [],
    };
  }

  // 🚀 RAG: Retrieve relevant knowledge base documents
  let ragContext = '';
  let ragSources: string[] = [];
  try {
    const similarDocs = await retrieveSimilarDocuments(userMessage, AI_CONFIG.RAG_TOP_K);
    if (similarDocs.length > 0) {
      ragContext = `\n\n📚 RELEVANT AWS BEST PRACTICES:
${similarDocs
  .map(
    (doc, i) =>
      `${i + 1}. ${doc.title} (${doc.severity})\n   Source: ${doc.source}\n   Preview: ${doc.content.substring(0, 150)}...`
  )
  .join('\n\n')}

Consider these best practices when answering.`;
      ragSources = similarDocs.map((doc) => `${doc.title} (${doc.source})`);
    }
  } catch (error) {
    console.error('❌ RAG retrieval failed:', error);
    // Continue without RAG context
  }

  // Build system context from alerts
  let systemContext = '';
  if (context?.alerts && context.alerts.length > 0) {
    const criticalCount = context.alerts.filter(a => a.severity === 'CRITICAL').length;
    const highCount = context.alerts.filter(a => a.severity === 'HIGH').length;
    
    systemContext = `\nCURRENT STATUS: ${context.alerts.length} alerts (${criticalCount} CRITICAL, ${highCount} HIGH) | ${context.resourceCount || 0} resources | $${context.totalCost || 0}/month`;
  }

  // Build message history
  const systemPrompt = `You are AWS Optimizer AI Expert created by Nikita. Your expertise:
✓ AWS security best practices & threat analysis
✓ Cost optimization & resource efficiency  
✓ Specific AWS CLI commands (exact syntax)
✓ Risk mitigation strategies (minimize downtime)
✓ Cloud infrastructure recommendations

RESPONSE FORMAT REQUIREMENTS:
1. Start with THREAT ANALYSIS: What's the actual risk?
2. Provide STEP-BY-STEP MITIGATION with exact AWS CLI commands
3. Include VERIFICATION steps to test each change
4. Provide ROLLBACK PLAN if something fails
5. Add BEST PRACTICES at the end

COMMAND FORMAT: When providing AWS CLI commands, use this format:
  aws ec2 describe-security-groups --group-ids sg-12345
  (Show region, profile if needed, explain each parameter)

RISK MINIMIZATION:
- For Security Groups: Add new rules FIRST, remove old rules LAST
- For migrations: Always test in one resource before bulk changes
- Always provide estimated time and impact assessment

${systemContext}
${ragContext}

Creator: Nikita
Current capabilities: AWS scanning, security analysis, cost recommendations

When user asks about security/cost issues, provide SPECIFIC, ACTIONABLE AWS CLI COMMANDS with clear step-by-step instructions.`;

  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
    {
      role: 'user',
      content: systemPrompt
    },
    {
      role: 'assistant',
      content: 'Understood. I will provide expert AWS optimization advice with specific CLI commands and risk mitigation strategies, informed by best practices.'
    }
  ];

  // Add chat history
  if (context?.chatHistory && context.chatHistory.length > 0) {
    const recentHistory = context.chatHistory.slice(-AI_CONFIG.MAX_CHAT_HISTORY_MESSAGES);
    if (recentHistory.length > 0) {
      console.log(`   📝 Using last ${recentHistory.length} chat messages (limit: ${AI_CONFIG.MAX_CHAT_HISTORY_MESSAGES})`);
      messages.push(...recentHistory);
    }
  }

  // Detect question type and add context-specific guidance
  const lowerMessage = userMessage.toLowerCase();
  let contextualGuidance = '';
  
  if (lowerMessage.includes('security group') || lowerMessage.includes('ssh') || lowerMessage.includes('port') || lowerMessage.includes('0.0.0.0')) {
    contextualGuidance = `\n\n[SYSTEM INSTRUCTION: This question is about Security Groups. Provide:
1. Exact AWS CLI describe/authorize/revoke commands with all parameters
2. Warning about 0.0.0.0/0 (anyone can access)
3. Step-by-step migration: ADD new rules first, REMOVE old rules last
4. IP ranges in CIDR notation
5. Test verification command]`;
  } else if (lowerMessage.includes('cost') || lowerMessage.includes('waste') || lowerMessage.includes('optimize') || lowerMessage.includes('save')) {
    contextualGuidance = `\n\n[SYSTEM INSTRUCTION: This is about cost optimization. Include:
1. Current estimated monthly cost
2. Specific resource IDs to delete/resize
3. Estimated monthly savings after changes
4. AWS CLI commands to identify unused resources
5. Shutdown/termination commands with safety checks]`;
  } else if (lowerMessage.includes('encryption') || lowerMessage.includes('ebs') || lowerMessage.includes('volume')) {
    contextualGuidance = `\n\n[SYSTEM INSTRUCTION: This is about EBS/storage security. Include:
1. Current encryption status check commands
2. Encryption best practices
3. How to enable EBS encryption by default
4. Volume type recommendations (gp3 > gp2)
5. Snapshot security considerations]`;
  }

  // Add current user message
  messages.push({
    role: 'user',
    content: userMessage + contextualGuidance
  });

  const response = await getGroqClient().chat.completions.create({
    model: 'llama-3.1-8b-instant',
    max_tokens: AI_CONFIG.MAX_TOKENS_CHAT,
    temperature: 0.3,
    messages: messages,
  });

  const aiResponse = response.choices[0].message.content || 'Check your dashboard.';
  
  // Return response with RAG sources
  return {
    text: aiResponse.trim(),
    ragSources: ragSources.slice(0, 3),
  };
}

/**
 * Export AI config for testing
 */
export { AI_CONFIG };
