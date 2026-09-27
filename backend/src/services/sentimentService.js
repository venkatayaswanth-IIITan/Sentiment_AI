const axios = require('axios');
const prisma = require('../config/db');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

class SentimentService {
  /**
   * Calls FastAPI ML microservice to get prediction
   */
  async analyzeText(content, modelType = 'bilstm') {
    try {
      const response = await axios.post(`${ML_SERVICE_URL}/predict`, {
        text: content,
        model_type: modelType
      });
      return response.data;
    } catch (error) {
      console.warn(`[SentimentService] ML Service unreachable, using fallback response: ${error.message}`);
      return {
        text: content,
        sentiment: 'NEUTRAL',
        confidence: 0.70,
        probabilities: { POSITIVE: 0.15, NEGATIVE: 0.15, NEUTRAL: 0.70 },
        aspects: [],
        model_version: 'fallback-baseline'
      };
    }
  }

  /**
   * Stores analyzed sentiment in database and aggregates aspect metrics
   */
  async recordSentiment({ brandId, source = 'manual', content, modelType }) {
    const mlResult = await this.analyzeText(content, modelType);

    // Save sentiment record if prisma is connected
    let savedRecord = null;
    try {
      savedRecord = await prisma.sentiment.create({
        data: {
          brandId: brandId || null,
          source: source,
          content: content,
          sentimentLabel: mlResult.sentiment,
          sentimentScore: mlResult.confidence,
          modelVersion: mlResult.model_version,
          aspects: mlResult.aspects,
        }
      });
    } catch (dbErr) {
      console.warn(`[SentimentService] DB save skipped: ${dbErr.message}`);
    }

    return {
      record: savedRecord,
      analysis: mlResult
    };
  }

  async getRecentSentiments(limit = 20) {
    try {
      return await prisma.sentiment.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { brand: true }
      });
    } catch (err) {
      return [];
    }
  }
}

module.exports = new SentimentService();
