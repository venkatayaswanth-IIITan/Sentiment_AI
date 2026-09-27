/**
 * forecastService.js
 * Derives a simple sentiment trend forecast from real Analysis records.
 * Uses linear regression over daily positive-rate data points.
 * Returns "insufficient_data" with fewer than 7 data points.
 */

const prisma = require('../config/db');

function linReg(xs, ys) {
  const n = xs.length;
  const sumX  = xs.reduce((a, v) => a + v, 0);
  const sumY  = ys.reduce((a, v) => a + v, 0);
  const sumXY = xs.reduce((a, v, i) => a + v * ys[i], 0);
  const sumX2 = xs.reduce((a, v) => a + v * v, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX || 1);
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

async function getForecast(userId, days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const analyses = await prisma.analysis.findMany({
    where: { userId, createdAt: { gte: since } },
    select: { sentiment: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  if (analyses.length < 7) {
    return {
      insufficient_data: true,
      required: 7,
      available: analyses.length,
      message: `Need at least 7 analyses to generate a forecast. You have ${analyses.length}.`,
    };
  }

  // Group by day
  const byDay = {};
  for (const a of analyses) {
    const day = a.createdAt.toISOString().slice(0, 10);
    if (!byDay[day]) byDay[day] = { total: 0, positive: 0 };
    byDay[day].total++;
    if (a.sentiment === 'positive') byDay[day].positive++;
  }

  const sorted = Object.keys(byDay).sort();
  const actualPoints = sorted.map((day, i) => ({
    date: day,
    positive_rate: Number(((byDay[day].positive / byDay[day].total) * 100).toFixed(1)),
    total: byDay[day].total,
    index: i,
  }));

  // Linear regression
  const xs = actualPoints.map(p => p.index);
  const ys = actualPoints.map(p => p.positive_rate);
  const { slope, intercept } = linReg(xs, ys);

  // Forecast next 7 days
  const lastIndex = actualPoints.length - 1;
  const forecast = [];
  for (let i = 1; i <= 7; i++) {
    const date = new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const predicted = Math.min(100, Math.max(0, Number((slope * (lastIndex + i) + intercept).toFixed(1))));
    forecast.push({ date, predicted_positive_rate: predicted, is_forecast: true });
  }

  const trend = slope > 0.5 ? 'improving'
    : slope < -0.5 ? 'declining'
    : 'stable';

  return {
    period_days: days,
    total_analyses: analyses.length,
    actual: actualPoints,
    forecast,
    trend,
    slope: Number(slope.toFixed(4)),
    intercept: Number(intercept.toFixed(4)),
    note: 'Forecast based on linear regression of your real sentiment data.',
  };
}

module.exports = { getForecast };
