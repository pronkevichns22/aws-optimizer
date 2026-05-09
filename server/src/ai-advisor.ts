// ============================================================================
// FILE: ai-advisor.ts
// LOCATION: server/src/
// PURPOSE: Groq AI integration for AWS optimization recommendations
// FEATURES: Analyzes alerts and provides actionable recommendations
// ============================================================================

import { Groq } from 'groq-sdk';

// ========== AI ADVISOR CONFIGURATION - MAXIMUM LIMITS ==========
const AI_CONFIG = {
  MAX_ALERTS_ANALYZE: 10,        // Process top 10 alerts only
  MAX_RECOMMENDATIONS: 4,         // Return max 4 recommendations
  MAX_TOKENS_MAIN: 512,           // Tokens for main recommendations
  MAX_TOKENS_SECURITY: 256,       // Tokens for security recommendations
  MAX_TOKENS_COST: 256,           // Tokens for cost recommendations
  MAX_TOKENS_CHAT: 400,           // Tokens for chat responses
  TEMPERATURE_FOCUSED: 0.3,       // Low temp for focused, concise answers
  MAX_ALERTS_SECURITY: 8,         // Max security alerts to analyze
  MAX_ALERTS_COST: 8,             // Max cost alerts to analyze
  MAX_CHAT_HISTORY_MESSAGES: 6,   // Context window: last 3 exchanges (user + assistant pairs)
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
}

/**
 * Get AI recommendations based on alerts
 * Uses Groq API to analyze top alerts and provide actionable recommendations
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

  const briefPrompt = `You are an AWS expert AI built into AWS Optimizer platform.

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

Analyze these alerts briefly (1-2 sentences):

${alertSummary}

RESPOND IN JSON ONLY - ONLY recommend what system CAN do:
{
  "summary": "1-2 sentences mentioning actionable steps",
  "recommendations": ["Use page X to...", "See report for..."],
  "priority": "URGENT|HIGH|MEDIUM|LOW"
}`;

  const detailedPrompt = `You are an AWS expert AI built into AWS Optimizer platform.

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

Analyze these alerts - provide ONLY actionable steps your system CAN do:

${alertSummary}

RESPOND IN JSON ONLY:
{
  "summary": "2-3 sentences about what to do IN YOUR SYSTEM",
  "recommendations": ["Go to X page to Y", "Review Z in report"],
  "estimatedSavings": "$XXX/month or TBD",
  "priority": "URGENT|HIGH|MEDIUM|LOW"
}

Rules: Only recommend your system's features. No external tools. Plain text.`;

  const prompt = detailed ? detailedPrompt : briefPrompt;

  const message = await getGroqClient().chat.completions.create({
    model: 'llama-3.1-8b-instant',
    max_tokens: detailed ? AI_CONFIG.MAX_TOKENS_MAIN : 200, // Use less tokens for brief
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
      };
    } else {
      return {
        summary: `${alerts.length} issues found. Click button for details.`,
        recommendations: ['View details in Security tab'],
        priority: criticalCount > 0 ? 'URGENT' : 'HIGH',
      };
    }
  }
}

/**
 * Generate security-focused recommendations
 */
export async function getSecurityRecommendations(
  securityAlerts: Alert[]
): Promise<string> {
  if (securityAlerts.length === 0) {
    return 'No security issues detected. Your infrastructure is secure.';
  }

  const alertSummary = securityAlerts
    .slice(0, AI_CONFIG.MAX_ALERTS_SECURITY)
    .map((a) => `- ${a.title}: ${a.description}`)
    .join('\n');

  const message = await getGroqClient().chat.completions.create({
    model: 'llama-3.1-8b-instant',
    max_tokens: AI_CONFIG.MAX_TOKENS_SECURITY,
    temperature: AI_CONFIG.TEMPERATURE_FOCUSED,
    messages: [
      {
        role: 'user',
        content: `As a security expert, provide 3 critical security fixes for these issues:

${alertSummary}

Format: Numbered list (1. 2. 3.). Each fix max 1 line. Be actionable. NO MARKDOWN - use plain text only.`,
      },
    ],
  });

  return message.choices[0].message.content || '';
}

/**
 * Generate cost optimization recommendations
 */
export async function getCostOptimizationRecommendations(
  costAlerts: Alert[]
): Promise<string> {
  if (costAlerts.length === 0) {
    return 'Your infrastructure is optimized for cost. No major savings opportunities found.';
  }

  const alertSummary = costAlerts
    .slice(0, AI_CONFIG.MAX_ALERTS_COST)
    .map((a) => `- ${a.title}: ${a.description}`)
    .join('\n');

  const message = await getGroqClient().chat.completions.create({
    model: 'llama-3.1-8b-instant',
    max_tokens: AI_CONFIG.MAX_TOKENS_COST,
    temperature: AI_CONFIG.TEMPERATURE_FOCUSED,
    messages: [
      {
        role: 'user',
        content: `Cost optimization specialist: Provide 3 ways to reduce costs:

${alertSummary}

Format: Numbered list (1. 2. 3.). Each action max 1 line. Include estimated savings. NO MARKDOWN - use plain text only.`,
      },
    ],
  });

  return message.choices[0].message.content || '';
}

/**
 * Handle user messages and questions about their infrastructure
 */
export async function getUserAIResponse(
  userMessage: string,
  context?: {
    alerts?: Alert[];
    resourceCount?: number;
    totalCost?: number;
    chatHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  }
): Promise<string> {
  if (!userMessage.trim()) {
    return 'Ask about your infrastructure.';
  }

  // Build system context from alerts
  let systemContext = '';
  if (context?.alerts && context.alerts.length > 0) {
    const criticalCount = context.alerts.filter(a => a.severity === 'CRITICAL').length;
    const highCount = context.alerts.filter(a => a.severity === 'HIGH').length;
    const securityAlerts = context.alerts.filter(a => a.type === 'SECURITY');
    const finopsAlerts = context.alerts.filter(a => a.type === 'FINOPS');
    
    systemContext = `\nCURRENT STATUS: ${context.alerts.length} alerts (${criticalCount} CRITICAL, ${highCount} HIGH) | ${context.resourceCount || 0} resources | $${context.totalCost || 0}/month`;
  }

  // Build message history - include previous messages for context
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
    {
      role: 'user',
      content: `You are AWS Optimizer AI. You help with:
✓ Reviewing Security/Cost alerts
✓ Explaining Resources/Security/Dashboard pages
✓ Identifying issues in their AWS infrastructure${systemContext}

If asked about something you can't do: "That requires manual AWS work, but I can help identify it."`
    }
  ];

  // Add chat history (limit to MAX_CHAT_HISTORY_MESSAGES for context window control)
  if (context?.chatHistory && context.chatHistory.length > 0) {
    const recentHistory = context.chatHistory.slice(-AI_CONFIG.MAX_CHAT_HISTORY_MESSAGES);
    if (recentHistory.length > 0) {
      console.log(`   📝 Using last ${recentHistory.length} chat messages (limit: ${AI_CONFIG.MAX_CHAT_HISTORY_MESSAGES})`);
      messages.push(...recentHistory);
    }
  }

  // Add current user message
  messages.push({
    role: 'user',
    content: userMessage
  });

  const response = await getGroqClient().chat.completions.create({
    model: 'llama-3.1-8b-instant',
    max_tokens: AI_CONFIG.MAX_TOKENS_CHAT, // Use config limit instead of hardcoded 100
    temperature: 0.3,
    messages: messages,
  });

  const aiResponse = response.choices[0].message.content || 'Check your dashboard.';
  
  // Don't truncate artificially - return full response
  return aiResponse.trim();
}
