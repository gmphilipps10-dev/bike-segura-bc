const mongoose = require('mongoose');

const appAnalyticsSchema = new mongoose.Schema({
  eventType: {
    type: String,
    enum: ['app_open', 'page_view', 'button_click'],
    required: true,
    index: true,
  },
  page: {
    type: String,
    default: '',
    trim: true,
    maxlength: 180,
    index: true,
  },
  button: {
    type: String,
    default: '',
    trim: true,
    maxlength: 120,
    index: true,
  },
  userId: {
    type: String,
    default: '',
    index: true,
  },
  anonymousId: {
    type: String,
    default: '',
    index: true,
  },
  userAgent: {
    type: String,
    default: '',
    maxlength: 500,
  },
}, {
  collection: 'app_analytics',
  timestamps: true,
});

appAnalyticsSchema.index({ createdAt: -1 });
appAnalyticsSchema.index({ eventType: 1, createdAt: -1 });

module.exports = mongoose.model('AppAnalytics', appAnalyticsSchema);
