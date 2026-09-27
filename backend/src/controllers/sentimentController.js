const sentimentService = require('../services/sentimentService');

class SentimentController {
  async analyze(req, res, next) {
    try {
      const { content, brandId, source, modelType } = req.body;
      const result = await sentimentService.recordSentiment({
        content,
        brandId,
        source,
        modelType
      });

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getRecent(req, res, next) {
    try {
      const limit = parseInt(req.query.limit, 10) || 20;
      const records = await sentimentService.getRecentSentiments(limit);
      return res.status(200).json({
        success: true,
        data: records
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SentimentController();
