const mongoose = require('mongoose');

const institutionalAccessLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'InstitutionalUser', default: null, index: true },
  userName: { type: String, default: '' },
  userEmail: { type: String, default: '', index: true },
  role: { type: String, default: '', index: true },
  institution: { type: String, default: '', index: true },
  action: { type: String, required: true, index: true },
  ip: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  resourceType: { type: String, default: '' },
  resourceId: { type: String, default: '' },
  searchTerm: { type: String, default: '' },
  searchType: { type: String, default: '' },
  reason: { type: String, default: '' },
  reasonText: { type: String, default: '' },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: { createdAt: true, updatedAt: false } });

institutionalAccessLogSchema.index({ institution: 1, createdAt: -1 });
institutionalAccessLogSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('InstitutionalAccessLog', institutionalAccessLogSchema);
