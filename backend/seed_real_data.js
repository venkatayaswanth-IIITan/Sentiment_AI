require('dotenv').config();
const prisma = require('./src/config/db');
const bcrypt = require('bcryptjs');

const SAMPLE_ANALYSES = [
  {
    text: "The new M-series chip speed is unbelievable, builds finish in seconds! Absolutely loving it.",
    sentiment: "positive",
    label: 1,
    confidence: 0.98,
    emotion: "joy",
    intent: "praise",
    aspects: JSON.stringify([{ aspect: "speed", sentiment: "POSITIVE", confidence: 0.99 }]),
    priorityScore: 0.1,
    riskLevel: "low",
    daysAgo: 1,
  },
  {
    text: "App crashed during checkout, payment was deducted but order failed. Customer support is completely unresponsive!",
    sentiment: "negative",
    label: 0,
    confidence: 0.97,
    emotion: "anger",
    intent: "complaint",
    aspects: JSON.stringify([
      { aspect: "reliability", sentiment: "NEGATIVE", confidence: 0.98 },
      { aspect: "customer_support", sentiment: "NEGATIVE", confidence: 0.95 }
    ]),
    priorityScore: 0.92,
    riskLevel: "critical",
    daysAgo: 1,
  },
  {
    text: "Just watched the product keynote. Incredible storytelling, gorgeous design, and a masterclass in UI.",
    sentiment: "positive",
    label: 1,
    confidence: 0.96,
    emotion: "joy",
    intent: "praise",
    aspects: JSON.stringify([{ aspect: "ui", sentiment: "POSITIVE", confidence: 0.96 }]),
    priorityScore: 0.12,
    riskLevel: "low",
    daysAgo: 2,
  },
  {
    text: "My package was delayed by 5 days and arrived with the box completely smashed. Very disappointing service.",
    sentiment: "negative",
    label: 0,
    confidence: 0.95,
    emotion: "sadness",
    intent: "complaint",
    aspects: JSON.stringify([{ aspect: "shipping", sentiment: "NEGATIVE", confidence: 0.97 }]),
    priorityScore: 0.78,
    riskLevel: "high",
    daysAgo: 3,
  },
  {
    text: "Our enterprise AI pipeline handled 10M events today with sub-20ms latency and zero dropped messages.",
    sentiment: "positive",
    label: 1,
    confidence: 0.99,
    emotion: "trust",
    intent: "praise",
    aspects: JSON.stringify([
      { aspect: "speed", sentiment: "POSITIVE", confidence: 0.98 },
      { aspect: "reliability", sentiment: "POSITIVE", confidence: 0.99 }
    ]),
    priorityScore: 0.05,
    riskLevel: "low",
    daysAgo: 4,
  },
  {
    text: "Would really appreciate dark mode and keyboard shortcuts in the next update. Still a great app overall.",
    sentiment: "positive",
    label: 1,
    confidence: 0.84,
    emotion: "anticipation",
    intent: "feature_request",
    aspects: JSON.stringify([{ aspect: "ui", sentiment: "POSITIVE", confidence: 0.88 }]),
    priorityScore: 0.25,
    riskLevel: "low",
    daysAgo: 5,
  },
  {
    text: "Billing statement has double charges again. If this isn't refunded immediately, I am cancelling my subscription.",
    sentiment: "negative",
    label: 0,
    confidence: 0.98,
    emotion: "anger",
    intent: "churn_risk",
    aspects: JSON.stringify([{ aspect: "pricing", sentiment: "NEGATIVE", confidence: 0.99 }]),
    priorityScore: 0.95,
    riskLevel: "critical",
    daysAgo: 6,
  },
  {
    text: "The customer onboarding flow is so smooth. Set up our team of 25 engineers in under 15 minutes.",
    sentiment: "positive",
    label: 1,
    confidence: 0.95,
    emotion: "joy",
    intent: "praise",
    aspects: JSON.stringify([{ aspect: "ui", sentiment: "POSITIVE", confidence: 0.94 }]),
    priorityScore: 0.1,
    riskLevel: "low",
    daysAgo: 7,
  },
  {
    text: "Battery drain on the latest mobile version is terrible. Phone gets burning hot within 20 minutes.",
    sentiment: "negative",
    label: 0,
    confidence: 0.93,
    emotion: "anger",
    intent: "bug_report",
    aspects: JSON.stringify([{ aspect: "battery_life", sentiment: "NEGATIVE", confidence: 0.96 }]),
    priorityScore: 0.82,
    riskLevel: "high",
    daysAgo: 8,
  },
  {
    text: "Fantastic customer support! Agent Alex helped diagnose our webhook configuration issue in real time.",
    sentiment: "positive",
    label: 1,
    confidence: 0.97,
    emotion: "trust",
    intent: "praise",
    aspects: JSON.stringify([{ aspect: "customer_support", sentiment: "POSITIVE", confidence: 0.98 }]),
    priorityScore: 0.08,
    riskLevel: "low",
    daysAgo: 9,
  },
  {
    text: "Pricing jumped 40% with zero new features. Considering moving our team to an open-source alternative.",
    sentiment: "negative",
    label: 0,
    confidence: 0.94,
    emotion: "disgust",
    intent: "churn_risk",
    aspects: JSON.stringify([{ aspect: "pricing", sentiment: "NEGATIVE", confidence: 0.95 }]),
    priorityScore: 0.88,
    riskLevel: "high",
    daysAgo: 10,
  },
  {
    text: "Export to CSV and PDF reports work like a charm. Saved our analytics team hours of manual spreadsheet work.",
    sentiment: "positive",
    label: 1,
    confidence: 0.94,
    emotion: "joy",
    intent: "praise",
    aspects: JSON.stringify([{ aspect: "reliability", sentiment: "POSITIVE", confidence: 0.92 }]),
    priorityScore: 0.15,
    riskLevel: "low",
    daysAgo: 11,
  },
  {
    text: "Search filters are glitchy on Safari mobile. Results keep jumping back to the top of the page.",
    sentiment: "negative",
    label: 0,
    confidence: 0.89,
    emotion: "anger",
    intent: "bug_report",
    aspects: JSON.stringify([{ aspect: "ui", sentiment: "NEGATIVE", confidence: 0.91 }]),
    priorityScore: 0.65,
    riskLevel: "medium",
    daysAgo: 12,
  },
  {
    text: "The accuracy of the sentiment classifier exceeded our expectations on Twitter slang and emoji data.",
    sentiment: "positive",
    label: 1,
    confidence: 0.96,
    emotion: "trust",
    intent: "praise",
    aspects: JSON.stringify([{ aspect: "quality", sentiment: "POSITIVE", confidence: 0.97 }]),
    priorityScore: 0.08,
    riskLevel: "low",
    daysAgo: 13,
  },
  {
    text: "Still waiting 3 weeks for an API access key. Communication from sales has been non-existent.",
    sentiment: "negative",
    label: 0,
    confidence: 0.96,
    emotion: "sadness",
    intent: "complaint",
    aspects: JSON.stringify([{ aspect: "customer_support", sentiment: "NEGATIVE", confidence: 0.97 }]),
    priorityScore: 0.79,
    riskLevel: "high",
    daysAgo: 14,
  },
  {
    text: "Super clean dashboard design. Love the dark mode and color accents, very pleasing to work with all day.",
    sentiment: "positive",
    label: 1,
    confidence: 0.98,
    emotion: "joy",
    intent: "praise",
    aspects: JSON.stringify([{ aspect: "ui", sentiment: "POSITIVE", confidence: 0.99 }]),
    priorityScore: 0.05,
    riskLevel: "low",
    daysAgo: 15,
  },
  {
    text: "Two factor authentication SMS is taking over 10 minutes to arrive. Locked out of my production account!",
    sentiment: "negative",
    label: 0,
    confidence: 0.95,
    emotion: "fear",
    intent: "bug_report",
    aspects: JSON.stringify([{ aspect: "reliability", sentiment: "NEGATIVE", confidence: 0.95 }]),
    priorityScore: 0.89,
    riskLevel: "high",
    daysAgo: 16,
  },
  {
    text: "Remarkable uptime. 99.99% achieved over the last quarter with zero degraded performance incidents.",
    sentiment: "positive",
    label: 1,
    confidence: 0.97,
    emotion: "trust",
    intent: "praise",
    aspects: JSON.stringify([{ aspect: "reliability", sentiment: "POSITIVE", confidence: 0.98 }]),
    priorityScore: 0.06,
    riskLevel: "low",
    daysAgo: 17,
  },
  {
    text: "The docs are well written and the code snippets in Python and Node.js worked right out of the box.",
    sentiment: "positive",
    label: 1,
    confidence: 0.93,
    emotion: "joy",
    intent: "praise",
    aspects: JSON.stringify([{ aspect: "quality", sentiment: "POSITIVE", confidence: 0.94 }]),
    priorityScore: 0.1,
    riskLevel: "low",
    daysAgo: 18,
  },
  {
    text: "Can we get webhook alerts when negative sentiment spikes above 40%? Would be a game changer.",
    sentiment: "positive",
    label: 1,
    confidence: 0.81,
    emotion: "anticipation",
    intent: "feature_request",
    aspects: JSON.stringify([{ aspect: "reliability", sentiment: "NEUTRAL", confidence: 0.82 }]),
    priorityScore: 0.35,
    riskLevel: "low",
    daysAgo: 19,
  },
  {
    text: "Refund request was processed in under 24 hours without any hassle. Appreciate the honest customer policy.",
    sentiment: "positive",
    label: 1,
    confidence: 0.96,
    emotion: "trust",
    intent: "praise",
    aspects: JSON.stringify([{ aspect: "customer_support", sentiment: "POSITIVE", confidence: 0.97 }]),
    priorityScore: 0.08,
    riskLevel: "low",
    daysAgo: 20,
  }
];

const SAMPLE_ALERTS = [
  {
    title: "🚨 Negative Spike Alert",
    message: "42% negative spike detected on checkout flow #PaymentFailure in the last 2 hours.",
    type: "negative_spike",
    read: false,
    daysAgo: 0,
  },
  {
    title: "⚡ AI Trend Insight",
    message: "Predictive model detected high churn risk keywords among annual subscribers.",
    type: "warning",
    read: false,
    daysAgo: 1,
  },
  {
    title: "✅ Model Calibrated",
    message: "Logistic Regression inference pipeline calibrated at 96.4% test accuracy.",
    type: "success",
    read: true,
    daysAgo: 2,
  },
  {
    title: "📊 Batch CSV Import",
    message: "450 customer feedback survey rows successfully ingested and classified.",
    type: "info",
    read: true,
    daysAgo: 3,
  }
];

async function seed() {
  console.log("Starting real data seeding...");

  // 1. Ensure test and demo users exist
  const passwordHash = await bcrypt.hash("demopassword123", 10);
  
  const userEmails = [
    { email: "analyst@brandpulse.ai", name: "Sarah Connor", role: "Lead Analyst" },
    { email: "test@example.com", name: "Test User", role: "Enterprise Analyst" },
    { email: "yaswanthvenkata245@gmail.com", name: "CHATAKONDU VENKATA YASWANTH", role: "Admin" },
    { email: "demo@sentimentai.com", name: "Demo User", role: "Analyst" }
  ];

  const createdUsers = [];

  for (const u of userEmails) {
    let user = await prisma.user.findUnique({ where: { email: u.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: u.email,
          name: u.name,
          role: u.role,
          passwordHash,
          avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${u.email}`,
          isActive: true,
          isVerified: true,
        }
      });
      console.log(`Created user: ${user.email} (${user.id})`);
    } else {
      console.log(`Found existing user: ${user.email} (${user.id})`);
    }
    createdUsers.push(user);
  }

  // 2. Populate analyses for each user so every user gets rich data
  for (const user of createdUsers) {
    const existingCount = await prisma.analysis.count({ where: { userId: user.id } });
    if (existingCount < 10) {
      console.log(`Seeding analyses for user ${user.email}...`);
      for (const sample of SAMPLE_ANALYSES) {
        const createdAt = new Date(Date.now() - sample.daysAgo * 24 * 60 * 60 * 1000 - Math.random() * 3600000);
        await prisma.analysis.create({
          data: {
            userId: user.id,
            text: sample.text,
            model: "logistic_regression",
            sentiment: sample.sentiment,
            label: sample.label,
            confidence: sample.confidence,
            emotion: sample.emotion,
            intent: sample.intent,
            aspects: sample.aspects,
            priorityScore: sample.priorityScore,
            riskLevel: sample.riskLevel,
            createdAt,
          }
        });
      }
    } else {
      console.log(`User ${user.email} already has ${existingCount} analyses.`);
    }

    // 3. Seed Alerts
    const existingAlerts = await prisma.alert.count({ where: { userId: user.id } });
    if (existingAlerts === 0) {
      for (const alert of SAMPLE_ALERTS) {
        const createdAt = new Date(Date.now() - alert.daysAgo * 24 * 60 * 60 * 1000);
        await prisma.alert.create({
          data: {
            userId: user.id,
            title: alert.title,
            message: alert.message,
            type: alert.type,
            read: alert.read,
            createdAt,
          }
        });
      }
    }

    // 4. Seed Brands
    const brandNames = ["BrandPulse AI", "Acme Cloud", "Apple M-Series"];
    for (const bName of brandNames) {
      const exists = await prisma.userBrand.findUnique({
        where: { userId_name: { userId: user.id, name: bName } }
      }).catch(() => null);
      if (!exists) {
        await prisma.userBrand.create({
          data: {
            userId: user.id,
            name: bName,
            keywords: bName.toLowerCase().replace(/\s+/g, ","),
          }
        }).catch(() => null);
      }
    }
  }

  console.log("Real data seeding complete!");
}

seed()
  .catch(e => {
    console.error("Seeding error:", e);
  })
  .finally(() => {
    prisma.$disconnect();
    process.exit(0);
  });
