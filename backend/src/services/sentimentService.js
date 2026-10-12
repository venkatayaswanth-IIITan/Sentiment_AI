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
      console.warn(`[SentimentService] ML Service unreachable, using dynamic calibrated NLP: ${error.message}`);
      const { analyzeSentiment } = require('./nlpSentimentAnalyzer');
      const dynamicResult = analyzeSentiment(content);
      return {
        text: content,
        sentiment: dynamicResult.sentiment.toUpperCase(),
        confidence: dynamicResult.confidence,
        probabilities: {
          POSITIVE: dynamicResult.positive_probability / 100,
          NEGATIVE: dynamicResult.negative_probability / 100,
          NEUTRAL: 0.05
        },
        aspects: [],
        model_version: 'v2.5-calibrated-nlp'
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
