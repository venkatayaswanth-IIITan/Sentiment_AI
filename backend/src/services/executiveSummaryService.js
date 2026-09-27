/**
 * executiveSummaryService.js
 * Generates structured executive summary and prioritized recommendations
 * using Google Gemini AI when configured, with seamless deterministic fallback.
 */

const prisma = require('../config/db');
const { getBrandHealth, getRootCauses } = require('./intelligenceService');
const { isGeminiConfigured, generateGeminiExecutiveInsights } = require('./geminiService');

async function getExecutiveSummary(userId, customKey = null) {
  const [health, rootCauses, recent, topIntents, topEmotions] = await Promise.all([
    getBrandHealth(userId),
    getRootCauses(userId),
    prisma.analysis.findMany({
      where: { userId },
      select: {
        text: true,
        sentiment: true,
        emotion: true,
        intent: true,
        aspects: true,
        priorityScore: true,
        riskLevel: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 60,
    }),
    prisma.analysis.groupBy({
      by: ['intent'],
      where: { userId, intent: { not: null } },
      _count: { intent: true },
      orderBy: { _count: { intent: 'desc' } },
      take: 5,
    }).catch(() => []),
    prisma.analysis.groupBy({
      by: ['emotion'],
      where: { userId, emotion: { not: null } },
      _count: { emotion: true },
      orderBy: { _count: { emotion: 'desc' } },
      take: 5,
    }).catch(() => []),
  ]);

  const total = recent.length;
  if (total === 0) {
    return {
      insufficient_data: true,
      message: 'No analyses recorded yet. Run a single or batch analysis to generate insights.',
      is_gemini_active: isGeminiConfigured(customKey),
    };
  }

  // Attempt Gemini AI Generation if configured
  if (isGeminiConfigured(customKey)) {
    try {
      const geminiRes = await generateGeminiExecutiveInsights({
        brandHealth: health,
        recentAnalyses: recent,
        topIntents,
        topEmotions,
        rootCauses,
        customKey
      });

      if (geminiRes?.data) {
        const d = geminiRes.data;
        return {
          generated_at: new Date().toISOString(),
          period: `Last ${total} verified customer interactions`,
          ai_powered: true,
          ai_model: geminiRes.modelUsed || 'gemini-1.5-flash',
          strategic_narrative: d.strategic_narrative || '',
          brand_health: health,
          summary_bullets: d.summary_bullets || [],
          top_intents: topIntents.map(r => ({ intent: r.intent, count: r._count?.intent || 0 })),
          top_emotions: topEmotions.map(r => ({ emotion: r.emotion, count: r._count?.emotion || 0 })),
          recommendations: d.recommendations || [],
          sentiment_outlook: d.sentiment_outlook || (health.trend === 'improving' ? 'improving' : 'stable'),
          note: `Powered by Google ${geminiRes.modelUsed || 'Gemini AI'} based on your actual live customer dataset.`,
        };
      }
    } catch (err) {
      console.warn('[ExecutiveSummary] Gemini generation failed, using deterministic fallback:', err.message);
    }
  }

  // Deterministic Fallback if Gemini not available or fails
  const positive = recent.filter(a => a.sentiment === 'positive').length;
  const negRate = ((total - positive) / total * 100).toFixed(1);
  const highPri = recent.filter(a => (a.priorityScore || 0) > 0.5).length;

  const bullets = [];
  if (health.label === 'excellent' || health.label === 'good') {
    bullets.push(`Brand health is ${health.label} at **${health.score}/100** with positive sentiment dominating recent volume.`);
  } else {
    bullets.push(`Brand health requires immediate attention (**${health.score}/100**). Negative sentiment rate stands at **${negRate}%**.`);
  }

  if (topIntents.length) {
    const top = topIntents[0]?.intent || 'general_feedback';
    bullets.push(`Primary customer intent is "**${top.replace(/_/g, ' ')}**" observed across ${topIntents[0]?._count?.intent || 0} interactions.`);
  }

  if (topEmotions.length) {
    const topE = topEmotions[0]?.emotion || 'neutral';
    bullets.push(`Dominant customer sentiment tone is characterized as "**${topE}**".`);
  }

  if (highPri > 0) {
    bullets.push(`Detected **${highPri} critical interactions** with urgency markers, refund demands, or severe frustration.`);
  }

  const fallbackRecommendations = [];
  if (parseFloat(negRate) > 40) {
    fallbackRecommendations.push({
      id: 'rec-det-1',
      priority: 'high',
      category: 'Customer Experience',
      title: 'Initiate negative feedback root-cause review',
      description: `With negative sentiment at ${negRate}%, addressing top complaints directly will protect churn.`,
      action: 'Conduct deep-dive on top recurring complaints this week.',
      expected_impact: 'Expected -15% reduction in negative velocity',
      owner: 'Customer Experience'
    });
  }
  if (highPri > 2) {
    fallbackRecommendations.push({
      id: 'rec-det-2',
      priority: 'critical',
      category: 'Customer Support',
      title: 'Enforce 24-hour response SLA on high-priority tickets',
      description: `${highPri} customers reported severe dissatisfaction requiring prompt intervention.`,
      action: 'Assign dedicated escalation agent for high-risk accounts.',
      expected_impact: 'Saves at-risk accounts from public escalation',
      owner: 'Support Operations'
    });
  }
  if (health.score < 50) {
    fallbackRecommendations.push({
      id: 'rec-det-3',
      priority: 'medium',
      category: 'Brand Trust',
      title: 'Launch proactive satisfaction survey',
      description: 'Collect granular feedback on service touchpoints to identify quick wins.',
      action: 'Send follow-up poll to recent detractors.',
      expected_impact: 'Identify key pain points early',
      owner: 'Product Marketing'
    });
  }

  return {
    generated_at: new Date().toISOString(),
    period: `Last ${total} analyses`,
    ai_powered: false,
    ai_model: 'heuristic-engine',
    strategic_narrative: `Brand sentiment currently holds a health score of ${health.score}/100 with a ${health.trend} trend across recent interactions.`,
    brand_health: health,
    summary_bullets: bullets,
    top_intents: topIntents.map(r => ({ intent: r.intent, count: r._count?.intent || 0 })),
    top_emotions: topEmotions.map(r => ({ emotion: r.emotion, count: r._count?.emotion || 0 })),
    recommendations: fallbackRecommendations,
    note: 'Generated using deterministic heuristic rules. Configure your Gemini API key to activate advanced AI reasoning.',
  };
}

module.exports = { getExecutiveSummary };
