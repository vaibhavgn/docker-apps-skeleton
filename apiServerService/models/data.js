const mongoose = require('mongoose');

// Define the schema for storing the data
const dataSchema = new mongoose.Schema({
  popularityPercentages: {
    news: [
      {
        key: String,
        count: Number,
        popularity: String,
      }
    ],
    socialMedia: [
      {
        key: String,
        count: Number,
        popularity: String,
      }
    ]
  },
  latestPercentChanges: {
    BTC: Object,
    ETH: Object,
    SOL: Object,
    XRP: Object,
    DOGE: Object,
    ADA: Object,
    TRX: Object,
    SHIB: Object,
    AVAX: Object,
    TON: Object,
  },
  chartData: Object,  // Store the chart data (timePrice, timeVolume for each ticker)
  createdAt: {
    type: Date,
    default: Date.now,  // Auto-populates the creation date
  }
});

// Create a model based on the schema
const Data = mongoose.model('Data', dataSchema);

module.exports = Data;
