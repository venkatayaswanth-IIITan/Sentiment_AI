const axios = require('axios');
const fs = require('fs');
const path = require('path');

const GEMINI_MODELS = [
  'gemini-flash-lite-latest',
  'gemini-3.5-flash-lite',
  'gemini-3.6-flash',
  'gemini-3.7-flash',
  'gemini-3.8-flash',
  'gemini-2.5-flash',
  'gemini-flash-latest',
  'gemini-2.5-pro',
  'gemini-pro-latest'
];

/**
 * Get active API key from env or argument
 */
function getActiveKey(customKey) {
  return (customKey || process.env.GEMINI_API_KEY || '').trim();
}

/**
 * Check if Gemini is configured
 */
function isGeminiConfigured(customKey) {
  const key = getActiveKey(customKey);
  return Boolean(key && key.length > 5 && !key.includes('your_gemini_api_key'));
}

/**
 * Save Gemini API Key into backend/.env and current process memory
 */
function saveGeminiApiKey(key) {
  const cleanKey = (key || '').trim();
  process.env.GEMINI_API_KEY = cleanKey;

  try {
    const envPath = path.resolve(__dirname, '../../.env');
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    if (envContent.includes('GEMINI_API_KEY=')) {
      envContent = envContent.replace(/GEMINI_API_KEY=.*/g, `GEMINI_API_KEY=${cleanKey}`);
    } else {
      envContent += `\nGEMINI_API_KEY=${cleanKey}\n`;
    }

    fs.writeFileSync(envPath, envContent, 'utf8');
    return { success: true, message: 'Gemini API key saved successfully.' };
  } catch (err) {
    console.error('Failed to write .env file:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Low-level caller to Gemini REST API with model fallback
 */
async function callGeminiApi(prompt, systemInstruction = '', customKey = null, jsonMode = true, enableSearch = false) {
  const apiKey = getActiveKey(customKey);
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }

  let lastError = null;

  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      
      const payload = {
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          topP: 0.85,
          maxOutputTokens: 2048,
          ...(jsonMode ? { responseMimeType: 'application/json' } : {})
        }
      };

      if (systemInstruction) {
        payload.systemInstruction = {
          parts: [{ text: systemInstruction }]
        };
      }

      // Enable real-time Google Search grounding if requested and not in strict JSON mode
      if (enableSearch && !jsonMode) {
        payload.tools = [{ googleSearch: {} }];
      }

      const res = await axios.post(url, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 25000
      });

      const candidate = res.data?.candidates?.[0];
      const text = candidate?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error(`Empty response from Gemini model ${model}`);
      }

      if (jsonMode) {
        try {
          return { data: JSON.parse(text), modelUsed: model };
        } catch {
          // If markdown wrap was returned despite responseMimeType
          const clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();
          return { data: JSON.parse(clean), modelUsed: model };
        }
      }

      // Extract search grounding sources if present
      const grounding = candidate?.groundingMetadata;
      let sources = [];
      if (grounding?.groundingChunks) {
        sources = grounding.groundingChunks
          .map(c => c.web)
          .filter(Boolean)
          .map(w => ({ title: w.title, url: w.uri }))
          .slice(0, 5);
      }

      return { text, modelUsed: model, sources, grounding };
    } catch (err) {
      const errMsg = err.response?.data?.error?.message || err.message;
      console.warn(`[Gemini] Failed with model ${model}:`, errMsg);
      lastError = new Error(`Gemini API error (${model}): ${errMsg}`);
    }
  }

  throw lastError || new Error('All Gemini models failed.');
}

/**
 * Generate deep AI Insights & Recommendations based on real data
 */
async function generateGeminiExecutiveInsights({
  brandHealth,
  recentAnalyses,
  topIntents,
  topEmotions,
  rootCauses,
  customKey
}) {
  const total = recentAnalyses.length;
  const positive = recentAnalyses.filter(a => a.sentiment === 'positive').length;
  const negative = recentAnalyses.filter(a => a.sentiment === 'negative').length;
  const neutral = total - positive - negative;
  const highPriority = recentAnalyses.filter(a => (a.priorityScore || 0) > 0.5).length;

  const negativeSamples = recentAnalyses
    .filter(a => a.sentiment === 'negative')
    .slice(0, 8)
    .map(a => `• "${a.text}" (Emotion: ${a.emotion || 'unknown'}, Intent: ${a.intent || 'unknown'})`);

  const positiveSamples = recentAnalyses
    .filter(a => a.sentiment === 'positive')
    .slice(0, 5)
    .map(a => `• "${a.text}" (Aspects: ${a.aspects || 'general'})`);

  const systemInstruction = `You are a Principal Customer Intelligence Strategist and Brand Data Analyst for BrandPulse AI.
You produce rigorous, evidence-based executive insights and high-ROI recommendations.
You strictly base your conclusions on the verified customer feedback and metrics provided.
Output ONLY a valid JSON object matching the requested schema. No markdown formatting around the JSON.`;

  const prompt = `Analyze this real customer sentiment dataset and generate strategic executive insights and prioritized recommendations.

=== REAL BRAND DATA METRICS ===
• Total Sampled Interactions: ${total}
• Sentiment Distribution: ${positive} Positive (${((positive / total) * 100).toFixed(1)}%), ${negative} Negative (${((negative / total) * 100).toFixed(1)}%), ${neutral} Neutral
• Brand Health Score: ${brandHealth?.score ?? 70}/100 (Status: ${brandHealth?.label ?? 'moderate'}, Trend: ${brandHealth?.trend ?? 'stable'})
• High Urgent Risk Interactions: ${highPriority}
• Top Customer Intents: ${topIntents?.map(i => `${i.intent} (${i._count?.intent || i.count})`).join(', ') || 'N/A'}
• Dominant Emotions Detected: ${topEmotions?.map(e => `${e.emotion} (${e._count?.emotion || e.count})`).join(', ') || 'N/A'}
• Top Root Causes of Friction: ${rootCauses?.root_causes?.map(r => `${r.category} (${r.percentage}%)`).join(', ') || 'General friction'}

=== SAMPLE RECENT NEGATIVE FEEDBACK ===
${negativeSamples.join('\n') || 'None recorded'}

=== SAMPLE RECENT POSITIVE FEEDBACK ===
${positiveSamples.join('\n') || 'None recorded'}

=== REQUIRED JSON OUTPUT SCHEMA ===
{
  "strategic_narrative": "A high-impact 1-2 sentence executive briefing on current brand momentum and core vulnerabilities.",
  "summary_bullets": [
    "Detailed bullet 1 highlighting brand perception dynamics with specific numbers and sentiment drivers.",
    "Detailed bullet 2 identifying primary operational or product friction points based on user quotes.",
    "Detailed bullet 3 evaluating customer emotional state and churn/retention hazards.",
    "Detailed bullet 4 highlighting positive strengths and customer advocates."
  ],
  "recommendations": [
    {
      "id": "rec-1",
      "priority": "critical" | "high" | "medium" | "low",
      "category": "Customer Support" | "Product & UX" | "Operations" | "Brand Trust",
      "title": "Concise, actionable recommendation title",
      "description": "Specific rationale connecting the recommendation to the real customer feedback observed.",
      "action": "Immediate tactical execution step to implement this week",
      "expected_impact": "Expected outcome (e.g. 'Reduces billing dispute churn by ~25%')",
      "owner": "Department owner (e.g. 'Engineering', 'Customer Experience', 'Operations')"
    }
  ],
  "sentiment_outlook": "improving" | "stable" | "at_risk" | "critical"
}

Provide 4 to 6 prioritized recommendations ordered by urgency (critical first, then high, medium, low).`;

  const result = await callGeminiApi(prompt, systemInstruction, customKey, true);
  return result;
}

module.exports = {
  isGeminiConfigured,
  saveGeminiApiKey,
  callGeminiApi,
  generateGeminiExecutiveInsights,
  getActiveKey
};
