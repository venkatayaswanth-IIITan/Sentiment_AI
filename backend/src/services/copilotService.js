/**
 * copilotService.js
 * Structured query-based AI Copilot.
 * By default operates without any external LLM — uses DB data + templates.
 * If LLM_API_KEY + LLM_BASE_URL env vars are set, routes the final answer
 * through an OpenAI-compatible API for natural language generation.
 */

const prisma = require('../config/db');
const { getBrandHealth, getEmotionDistribution, getCrisisSignals } = require('./intelligenceService');

const SYSTEM_PROMPT = `You are BrandPulse Copilot, an advanced, highly intelligent AI assistant and brand analytics expert.
You have access to the user's real-time sentiment analysis data and general AI/NLP and industry expertise.
- If the user asks about their brand, customers, metrics, sentiments, or data, answer directly using their real data context accurately.
- If the user asks any general question (such as "what is ai", technical concepts, strategy, advice, definitions, or general knowledge), answer thoroughly, clearly, and helpfully with your full AI knowledge.
- Format all responses in clean, structured markdown with headings, bullet points, or bold text where appropriate.
- Always be helpful, engaging, and professional.`;

// ── RAG context builder ───────────────────────────────────────────────────────
async function buildContext(userId) {
  const [summary, health, emotions, recent] = await Promise.all([
    prisma.analysis.aggregate({
      where: { userId },
      _count: { _all: true },
    }),
    getBrandHealth(userId),
    getEmotionDistribution(userId),
    prisma.analysis.findMany({
      where: { userId },
      select: { text: true, sentiment: true, emotion: true, intent: true, riskLevel: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ]);

  const totalAnalyses = summary._count._all;
  const positive = await prisma.analysis.count({ where: { userId, sentiment: 'positive' } });
  const negative = await prisma.analysis.count({ where: { userId, sentiment: 'negative' } });

  return {
    totalAnalyses,
    positive,
    negative,
    positiveRate: totalAnalyses > 0 ? ((positive / totalAnalyses) * 100).toFixed(1) : 0,
    brandHealth: health.insufficient_data ? null : health,
    dominantEmotion: emotions.dominant || 'neutral',
    recentSamples: recent.slice(0, 10).map(a => ({
      text: a.text?.slice(0, 80),
      sentiment: a.sentiment,
      emotion: a.emotion,
      intent: a.intent,
    })),
  };
}

// ── Intent detection for query routing ───────────────────────────────────────
function detectQueryIntent(message) {
  const lower = message.toLowerCase();
  if (/health|score|how.*brand|overall/.test(lower))      return 'brand_health';
  if (/crisis|alert|urgent|emergency/.test(lower))         return 'crisis';
  if (/emotion|feel|mood|sentiment/.test(lower))           return 'emotions';
  if (/intent|complain|refund|praise/.test(lower))         return 'intents';
  if (/aspect|product|service|delivery/.test(lower))       return 'aspects';
  if (/topic|keyword|theme|trend/.test(lower))             return 'topics';
  if (/forecast|predict|future|next week/.test(lower))     return 'forecast';
  if (/recommend|suggest|should i|what.*do/.test(lower))   return 'recommendations';
  if (/summary|report|overview/.test(lower))               return 'summary';
  if (/negative|bad|worst/.test(lower))                    return 'negative_analysis';
  if (/positive|good|best/.test(lower))                    return 'positive_analysis';
  return 'general';
}

// ── Template-based response generator (no LLM fallback) ───────────────────────
function generateStructuredResponse(queryIntent, ctx, userMessage = '') {
  const { totalAnalyses, positive, negative, positiveRate, brandHealth, dominantEmotion, recentSamples } = ctx;
  const lower = (userMessage || '').toLowerCase();

  // If question is a general concept like "what is ai"
  if (/what.*ai|artificial intelligence/i.test(lower)) {
    return `### What is Artificial Intelligence (AI)?\n\n**Artificial Intelligence (AI)** refers to computer systems engineered to simulate human intelligence and problem-solving capabilities. It encompasses technologies that enable machines to learn from data, reason, recognize patterns, and make decisions.\n\n#### Key Branches of AI:\n- **Deep Learning**: Advanced neural architectures like our primary **CNN + BiLSTM** (82.56% accuracy), combining convolutional feature extractors and bidirectional recurrent memory.\n- **Machine Learning (ML)**: Statistical classifiers like our secondary **Logistic Regression** (77.85% accuracy).\n- **Natural Language Processing (NLP)**: Enables computers to understand, interpret, and process human text and spoken language — powering platforms like BrandPulse AI.\n- **Large Language Models (LLMs)**: Multi-layer neural networks (like Gemini) capable of understanding rich semantics and generating natural explanations.\n\nIn **BrandPulse AI**, we combine deep learning classification models and NLP to automatically score customer sentiment, detect emotional undertones, and extract actionable brand intelligence.`;
  }

  if (/what.*sentiment|how.*sentiment/i.test(lower)) {
    return `### What is Sentiment Analysis?\n\n**Sentiment Analysis** (often called opinion mining) is an NLP technique that detects the emotional tone behind words. It categorizes text into **positive**, **negative**, or **neutral** sentiment.\n\nIn BrandPulse AI, customer feedback is automatically classified using trained models (primary: **CNN + BiLSTM** with 82.56% accuracy, secondary: **Logistic Regression**), along with emotion and intent detection, to calculate real-time brand health metrics.`;
  }

  if (totalAnalyses === 0) {
    return "You don't have any analyses yet. Start by analyzing some text in the **Sentiment Analysis** page to get personalized insights.";
  }

  switch (queryIntent) {
    case 'brand_health':
      if (!brandHealth) return `You have **${totalAnalyses}** analyses. Run more to unlock brand health scoring.`;
      return `## Brand Health Report\n\n**Score: ${brandHealth.score}/100** (${brandHealth.label})\n\n- Positive rate: **${brandHealth.positive_rate}%**\n- Avg confidence: **${brandHealth.avg_confidence}%**\n- Complaint rate: **${brandHealth.complaint_rate}%**\n- Trend: **${brandHealth.trend}**\n\n${brandHealth.score < 50 ? '⚠️ Action needed: High negative volume detected.' : '✅ Brand health looks stable.'}`;

    case 'emotions':
      return `## Emotion Analysis\n\nDominant emotion in your data: **${dominantEmotion}**\n\nYour customers' feedback is primarily characterised by **${dominantEmotion}** signals. This is based on ${totalAnalyses} analyses.\n\n${dominantEmotion === 'anger' ? '⚠️ High anger signals detected. Prioritise complaint resolution.' : dominantEmotion === 'joy' ? '✅ Great — customers express positive emotions.' : 'Review the Intelligence page for a full emotion breakdown.'}`;

    case 'negative_analysis':
      return `## Negative Feedback Summary\n\n- **${negative}** negative analyses out of ${totalAnalyses} total\n- Negative rate: **${(100 - parseFloat(positiveRate)).toFixed(1)}%**\n\n**Recent negative samples:**\n${recentSamples.filter(s => s.sentiment === 'negative').slice(0, 3).map(s => `- "${s.text}"`).join('\n') || 'No recent negatives.'}\n\nVisit the **Root Cause** section in Intelligence for detailed breakdown.`;

    case 'positive_analysis':
      return `## Positive Feedback Summary\n\n- **${positive}** positive analyses out of ${totalAnalyses} total\n- Positive rate: **${positiveRate}%**\n\n**Recent positive samples:**\n${recentSamples.filter(s => s.sentiment === 'positive').slice(0, 3).map(s => `- "${s.text}"`).join('\n') || 'No recent positives.'}`;

    case 'recommendations':
      const recs = [];
      if (parseFloat(positiveRate) < 50) recs.push('🔴 Investigate and resolve the top complaint categories');
      if (brandHealth?.complaint_rate > 30) recs.push('🟠 High complaint rate — prioritise customer support response time');
      recs.push('🟡 Analyse ABSA aspects to find which product areas need improvement');
      recs.push('🟢 Continue monitoring sentiment daily using the Forecast page');
      return `## AI Recommendations\n\n${recs.map((r, i) => `${i + 1}. ${r}`).join('\n')}`;

    case 'summary':
      return `## Quick Summary\n\n- **${totalAnalyses}** total analyses\n- **${positiveRate}%** positive rate\n- Dominant emotion: **${dominantEmotion}**\n- Brand health: **${brandHealth ? brandHealth.score + '/100 (' + brandHealth.label + ')' : 'Not enough data'}**\n\nFor deeper insights, check the **Intelligence** and **Forecast** sections.`;

    default:
      return `## BrandPulse Copilot\n\nHere's what I know about your brand:\n\n- **${totalAnalyses}** analyses collected\n- **${positiveRate}%** positive sentiment rate\n- Dominant emotion: **${dominantEmotion}**\n\nYou can ask me:\n- "What's my brand health score?"\n- "Show me negative feedback trends"\n- "What should I improve?"\n- "What is AI and how does it help my brand?"`;
  }
}

// ── Optional LLM call ─────────────────────────────────────────────────────────
async function callLLM(messages) {
  const apiKey  = process.env.LLM_API_KEY;
  const baseUrl = process.env.LLM_BASE_URL || 'https://api.openai.com/v1';
  const model   = process.env.LLM_MODEL || 'gpt-4o-mini';

  if (!apiKey) return null;

  try {
    const resp = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages, max_tokens: 600, temperature: 0.3 }),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    return data?.choices?.[0]?.message?.content || null;
  } catch {
    return null;
  }
}

// ── Public API ────────────────────────────────────────────────────────────────
async function chat(userId, message, conversationHistory = []) {
  const ctx = await buildContext(userId);
  const queryIntent = detectQueryIntent(message);

  // Build structured response as foundation/fallback
  const structuredAnswer = generateStructuredResponse(queryIntent, ctx, message);

  // Check if Gemini or OpenAI LLM is available
  const { isGeminiConfigured, callGeminiApi } = require('./geminiService');
  const geminiActive = isGeminiConfigured();
  const llmEnabled = !!process.env.LLM_API_KEY;
  let finalAnswer = structuredAnswer;
  let modelUsed = null;
  let sources = [];

  if (geminiActive) {
    try {
      const contextStr = JSON.stringify({
        totalAnalyses: ctx.totalAnalyses,
        positive: ctx.positive,
        negative: ctx.negative,
        positiveRate: ctx.positiveRate,
        brandHealth: ctx.brandHealth,
        dominantEmotion: ctx.dominantEmotion,
        recentSamples: ctx.recentSamples,
      }, null, 2);

      const prompt = `USER QUESTION:
${message}

REAL DATABASE CONTEXT (Reference this if the user asks about brand metrics, customer sentiment, feedback, or records):
${contextStr}

CONVERSATION HISTORY:
${conversationHistory.slice(-4).map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}

INSTRUCTIONS:
1. Answer the user's question directly, clearly, and comprehensively using clean Markdown.
2. If the user asks about their brand, health score, negative/positive feedback, or trends, rely on the real database context above accurately.
3. If the user asks ANY general, technical, conceptual, AI, marketing, or general knowledge question, give a thorough, engaging, educational, and high-quality explanation.
4. REAL-WORLD DATA VERIFICATION & FACT CHECKING: If the user asks to verify whether real-world data, news, statistics, or facts are correct or not, use your live Google Search grounding to evaluate the claim. Clearly state whether the data is VERIFIED CORRECT, INCORRECT, or MIXED, explaining the exact real-world facts with updated figures and citations.`;

      const geminiResult = await callGeminiApi(prompt, SYSTEM_PROMPT, null, false, true);
      if (geminiResult?.text) {
        finalAnswer = geminiResult.text;
        modelUsed = geminiResult.modelUsed || 'gemini-flash-lite-latest';
        sources = geminiResult.sources || [];
      }
    } catch (err) {
      console.warn('[Copilot] Gemini chat failed, using structured response:', err.message);
    }

  } else if (llmEnabled) {
    const contextStr = JSON.stringify({
      totalAnalyses: ctx.totalAnalyses,
      positive: ctx.positive,
      negative: ctx.negative,
      positiveRate: ctx.positiveRate,
      brandHealth: ctx.brandHealth,
      dominantEmotion: ctx.dominantEmotion,
    }, null, 2);

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'system', content: `DATA CONTEXT:\n${contextStr}\n\nPRE-COMPUTED ANSWER:\n${structuredAnswer}` },
      ...conversationHistory.slice(-6).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message },
    ];

    const llmAnswer = await callLLM(messages);
    if (llmAnswer) {
      finalAnswer = llmAnswer;
      modelUsed = 'openai';
    }
  }

  return {
    answer: finalAnswer,
    intent: queryIntent,
    data_context: {
      total_analyses: ctx.totalAnalyses,
      positive_rate: ctx.positiveRate,
      brand_health_score: ctx.brandHealth?.score ?? null,
    },
    llm_enhanced: (geminiActive || llmEnabled) && finalAnswer !== structuredAnswer,
    model_used: modelUsed,
    sources: geminiActive ? (sources || []) : [],
  };
}

module.exports = { chat };
