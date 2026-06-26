const mongoose = require('mongoose');

const appAnalyticsSchema = new mongoose.Schema({
  event_type: {
    type: String,
    enum: ['app_open', 'page_view', 'button_click'],
    required: true,
    index: true,
  },
  // Campos legados mantidos para compatibilidade com eventos ja gravados.
  eventType: {
    type: String,
    enum: ['app_open', 'page_view', 'button_click', ''],
    default: '',
    index: true,
  },
  page: {
    type: String,
    default: '',
    trim: true,
    maxlength: 180,
    index: true,
  },
  button_name: {
    type: String,
    default: '',
    trim: true,
    maxlength: 120,
    index: true,
  },
  button: {
    type: String,
    default: '',
    trim: true,
    maxlength: 120,
    index: true,
  },
  user_id: {
    type: String,
    default: '',
    index: true,
  },
  userId: {
    type: String,
    default: '',
    index: true,
  },
  anonymous_id: {
    type: String,
    default: '',
    index: true,
  },
  anonymousId: {
    type: String,
    default: '',
    index: true,
  },
  user_agent: {
    type: String,
    default: '',
    maxlength: 500,
  },
  userAgent: {
    type: String,
    default: '',
    maxlength: 500,
  },
}, {
  collection: 'app_analytics',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

appAnalyticsSchema.index({ created_at: -1 });
appAnalyticsSchema.index({ event_type: 1, created_at: -1 });
appAnalyticsSchema.index({ createdAt: -1 });
appAnalyticsSchema.index({ eventType: 1, createdAt: -1 });

module.exports = mongoose.model('AppAnalytics', appAnalyticsSchema);
