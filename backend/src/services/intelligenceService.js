/**
 * intelligenceService.js
 * Derives AI intelligence insights from existing Analysis records.
 * All data is computed from real database records — nothing is fabricated.
 */

const prisma = require('../config/db');

// ── Emotion Distribution ──────────────────────────────────────────────────────
async function getEmotionDistribution(userId) {
  const analyses = await prisma.analysis.findMany({
    where: { userId, emotion: { not: null } },
    select: { emotion: true },
  });

  if (analyses.length === 0) {
    return { insufficient_data: true, total: 0, distribution: {} };
  }

  const counts = {};
  for (const a of analyses) {
    const e = a.emotion || 'neutral';
    counts[e] = (counts[e] || 0) + 1;
  }

  const total = analyses.length;
  const distribution = {};
  for (const [emotion, count] of Object.entries(counts)) {
    distribution[emotion] = {
      count,
      percentage: Number(((count / total) * 100).toFixed(1)),
    };
  }

  const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';

  return { total, dominant, distribution };
}

// ── Intent Breakdown ──────────────────────────────────────────────────────────
async function getIntentBreakdown(userId) {
  const analyses = await prisma.analysis.findMany({
    where: { userId, intent: { not: null } },
    select: { intent: true, sentiment: true },
  });

  if (analyses.length === 0) {
    return { insufficient_data: true, total: 0, breakdown: {} };
  }

  const counts = {};
  for (const a of analyses) {
    const i = a.intent || 'general_feedback';
    if (!counts[i]) counts[i] = { total: 0, positive: 0, negative: 0 };
    counts[i].total++;
    if (a.sentiment === 'positive') counts[i].positive++;
    else counts[i].negative++;
  }

  const total = analyses.length;
  const breakdown = {};
  for (const [intent, data] of Object.entries(counts)) {
    breakdown[intent] = {
      ...data,
      percentage: Number(((data.total / total) * 100).toFixed(1)),
    };
  }

  const dominant = Object.entries(counts).sort((a, b) => b[1].total - a[1].total)[0]?.[0] || 'general_feedback';

  return { total, dominant, breakdown };
}

// ── Aspect Aggregation ────────────────────────────────────────────────────────
async function getAspectAggregation(userId) {
  const analyses = await prisma.analysis.findMany({
    where: { userId, aspects: { not: '[]' } },
    select: { aspects: true },
  });

  if (analyses.length === 0) {
    return { insufficient_data: true, total_records: 0, aspects: {} };
  }

  const aspectMap = {};

  for (const a of analyses) {
    let parsed = [];
    try { parsed = JSON.parse(a.aspects || '[]'); } catch { continue; }

    for (const asp of parsed) {
      if (!asp.aspect) continue;
      if (!aspectMap[asp.aspect]) {
        aspectMap[asp.aspect] = { positive: 0, negative: 0, neutral: 0, total: 0, totalConf: 0 };
      }
      const bucket = (asp.sentiment || 'NEUTRAL').toLowerCase();
      aspectMap[asp.aspect][bucket]++;
      aspectMap[asp.aspect].total++;
      aspectMap[asp.aspect].totalConf += (asp.confidence || 0);
    }
  }

  const aspects = {};
  for (const [name, data] of Object.entries(aspectMap)) {
    const { total, totalConf, ...counts } = data;
    aspects[name] = {
      ...counts,
      total,
      avgConfidence: total > 0 ? Number((totalConf / total).toFixed(2)) : 0,
      dominantSentiment:
        counts.positive >= counts.negative && counts.positive >= counts.neutral ? 'POSITIVE'
        : counts.negative >= counts.positive && counts.negative >= counts.neutral ? 'NEGATIVE'
        : 'NEUTRAL',
    };
  }

  return { total_records: analyses.length, aspects };
}

// ── Topic Discovery (keyword clustering) ─────────────────────────────────────
async function getTopics(userId) {
  const analyses = await prisma.analysis.findMany({
    where: { userId },
    select: { text: true, sentiment: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  if (analyses.length < 3) {
    return { insufficient_data: true, topics: [] };
  }

  // Stopwords
  const STOP = new Set([
    'the','a','an','is','it','in','on','at','to','for','of','and','or','but',
    'this','that','these','those','with','from','was','are','were','be','been',
    'have','has','had','do','did','does','will','would','could','should','may',
    'might','shall','can','i','you','he','she','we','they','my','your','our',
    'their','its','me','him','her','us','them','not','no','nor','so','yet',
    'also','just','very','much','more','most','some','any','all','each','both',
    'own','same','than','then','when','where','which','who','whom','what',
    'how','if','while','although','though','because','since','until','after',
    'before','above','below','between','into','through','during','about',
  ]);

  const wordFreq = {};
  const wordSentiment = {};

  for (const a of analyses) {
    const words = (a.text || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3 && !STOP.has(w));

    for (const w of words) {
      wordFreq[w] = (wordFreq[w] || 0) + 1;
      if (!wordSentiment[w]) wordSentiment[w] = { pos: 0, neg: 0 };
      if (a.sentiment === 'positive') wordSentiment[w].pos++;
      else wordSentiment[w].neg++;
    }
  }

  const topics = Object.entries(wordFreq)
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word, count]) => {
      const { pos = 0, neg = 0 } = wordSentiment[word] || {};
      const total = pos + neg || 1;
      return {
        topic: word,
        count,
        sentiment: pos / total > 0.6 ? 'positive' : neg / total > 0.6 ? 'negative' : 'mixed',
        positiveRate: Number(((pos / total) * 100).toFixed(0)),
      };
    });

  return { total_analysed: analyses.length, topics };
}

// ── Root Cause Analysis ───────────────────────────────────────────────────────
async function getRootCauses(userId) {
  const analyses = await prisma.analysis.findMany({
    where: { userId, sentiment: 'negative' },
    select: { text: true, intent: true, aspects: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  if (analyses.length === 0) {
    return { insufficient_data: true, negative_count: 0, root_causes: [] };
  }

  const aspectCounts = {};
  const intentCounts = {};

  for (const a of analyses) {
    // Intent-based root causes
    const intent = a.intent || 'general_feedback';
    intentCounts[intent] = (intentCounts[intent] || 0) + 1;

    // Aspect-based root causes
    let aspects = [];
    try { aspects = JSON.parse(a.aspects || '[]'); } catch {}
    for (const asp of aspects) {
      if (asp.sentiment === 'NEGATIVE') {
        aspectCounts[asp.aspect] = (aspectCounts[asp.aspect] || 0) + 1;
      }
    }
  }

  const root_causes = [];

  // From aspects
  for (const [aspect, count] of Object.entries(aspectCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)) {
    root_causes.push({
      type: 'aspect',
      category: aspect,
      count,
      percentage: Number(((count / analyses.length) * 100).toFixed(1)),
      severity: count / analyses.length > 0.5 ? 'critical' : count / analyses.length > 0.25 ? 'high' : 'medium',
    });
  }

  // From intents (complaints / refunds / urgency)
  const urgentIntents = ['complaint', 'refund_request', 'urgency'];
  for (const intent of urgentIntents) {
    const count = intentCounts[intent] || 0;
    if (count > 0) {
      root_causes.push({
        type: 'intent',
        category: intent,
        count,
        percentage: Number(((count / analyses.length) * 100).toFixed(1)),
        severity: count / analyses.length > 0.4 ? 'critical' : 'high',
      });
    }
  }

  root_causes.sort((a, b) => b.count - a.count);

  return {
    negative_count: analyses.length,
    root_causes: root_causes.slice(0, 8),
  };
}

// ── Brand Health Score ────────────────────────────────────────────────────────
async function getBrandHealth(userId) {
  const [summary, recent] = await Promise.all([
    prisma.analysis.findMany({
      where: { userId },
      select: { sentiment: true, confidence: true, priorityScore: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.analysis.findMany({
      where: { userId },
      select: { sentiment: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ]);

  if (summary.length === 0) {
    return { insufficient_data: true, score: null };
  }

  const total = summary.length;
  const positive = summary.filter(a => a.sentiment === 'positive').length;
  const posRate = positive / total;

  const confScores = summary.map(a => a.confidence).filter(c => c != null);
  const avgConf = confScores.length > 0
    ? confScores.reduce((s, v) => s + v, 0) / confScores.length
    : 0.5;

  const highPriority = summary.filter(a => (a.priorityScore || 0) > 0.5).length;
  const complaintRate = highPriority / total;

  // Recent trend (compare last 10 vs previous 10)
  const recentPos = recent.slice(0, 10).filter(a => a.sentiment === 'positive').length / Math.max(1, Math.min(10, recent.slice(0, 10).length));
  const prevPos = recent.slice(10, 20).filter(a => a.sentiment === 'positive').length / Math.max(1, Math.min(10, recent.slice(10, 20).length));
  const trendDelta = recentPos - prevPos;

  // Composite health score (0–100)
  let score = (posRate * 50) + (avgConf * 20) + ((1 - complaintRate) * 20) + (Math.min(total, 50) / 50 * 10);
  if (trendDelta > 0) score = Math.min(100, score + trendDelta * 10);

  score = Math.round(score);

  const healthLabel =
    score >= 80 ? 'excellent'
    : score >= 65 ? 'good'
    : score >= 45 ? 'fair'
    : score >= 25 ? 'poor'
    : 'critical';

  return {
    score,
    label: healthLabel,
    total_analyses: total,
    positive_rate: Number((posRate * 100).toFixed(1)),
    avg_confidence: Number((avgConf * 100).toFixed(1)),
    complaint_rate: Number((complaintRate * 100).toFixed(1)),
    trend: trendDelta > 0.05 ? 'improving' : trendDelta < -0.05 ? 'declining' : 'stable',
    note: 'BrandPulse calculated score — based on your own analysis data.',
  };
}

// ── Crisis Detection ──────────────────────────────────────────────────────────
async function getCrisisSignals(userId) {
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const last1h  = new Date(Date.now() - 60 * 60 * 1000);

  const [recent24, recent1h, urgent] = await Promise.all([
    prisma.analysis.findMany({
      where: { userId, createdAt: { gte: last24h } },
      select: { sentiment: true, intent: true, priorityScore: true, riskLevel: true },
    }),
    prisma.analysis.findMany({
      where: { userId, createdAt: { gte: last1h } },
      select: { sentiment: true, priorityScore: true },
    }),
    prisma.analysis.findMany({
      where: { userId, riskLevel: { in: ['high', 'critical'] } },
      select: { text: true, emotion: true, intent: true, riskLevel: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  const neg24 = recent24.filter(a => a.sentiment === 'negative').length;
  const neg24Rate = recent24.length > 0 ? neg24 / recent24.length : 0;

  const neg1h = recent1h.filter(a => a.sentiment === 'negative').length;
  const neg1hRate = recent1h.length > 0 ? neg1h / recent1h.length : 0;

  const criticalCount = recent24.filter(a => a.riskLevel === 'critical').length;
  const urgentIntentCount = recent24.filter(a => ['complaint', 'refund_request', 'urgency'].includes(a.intent)).length;

  // Crisis thresholds
  const isCrisis =
    (neg24Rate > 0.7 && recent24.length >= 5) ||
    (neg1hRate > 0.8 && recent1h.length >= 3) ||
    (criticalCount >= 3);

  const crisisScore = Math.min(100, Math.round(
    (neg24Rate * 40) + (neg1hRate * 30) + (criticalCount / Math.max(1, recent24.length) * 30) * 100
  ));

  return {
    is_crisis: isCrisis,
    crisis_score: crisisScore,
    last_24h: {
      total: recent24.length,
      negative: neg24,
      negative_rate: Number((neg24Rate * 100).toFixed(1)),
      critical_count: criticalCount,
      urgent_intents: urgentIntentCount,
    },
    last_1h: {
      total: recent1h.length,
      negative: neg1h,
      negative_rate: Number((neg1hRate * 100).toFixed(1)),
    },
    recent_high_risk: urgent.map(a => ({
      text: a.text?.slice(0, 120),
      emotion: a.emotion,
      intent: a.intent,
      risk_level: a.riskLevel,
      at: a.createdAt,
    })),
  };
}

module.exports = {
  getEmotionDistribution,
  getIntentBreakdown,
  getAspectAggregation,
  getTopics,
  getRootCauses,
  getBrandHealth,
  getCrisisSignals,
};
