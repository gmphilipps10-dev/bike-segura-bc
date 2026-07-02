const mongoose = require('mongoose');

const institutionalTriggerSchema = new mongoose.Schema({
  bikeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bike', required: true, index: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  institutionalUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'InstitutionalUser', required: true, index: true },
  userName: { type: String, default: '' },
  userEmail: { type: String, default: '' },
  role: { type: String, default: '' },
  institution: { type: String, required: true, index: true },
  reason: { type: String, required: true },
  reasonText: { type: String, default: '' },
  status: { type: String, enum: ['open', 'in_progress', 'resolved', 'dismissed'], default: 'open', index: true },
  notes: { type: String, default: '' },
  equipmentSnapshot: {
    status: { type: String, default: '' },
    type: { type: String, default: '' },
    brand: { type: String, default: '' },
    model: { type: String, default: '' },
    color: { type: String, default: '' },
    serieMasked: { type: String, default: '' },
    cityUf: { type: String, default: '' },
  },
  resolvedAt: { type: Date, default: null },
  resolvedBy: { type: String, default: '' },
}, { timestamps: true });

institutionalTriggerSchema.index({ institution: 1, createdAt: -1 });

module.exports = mongoose.model('InstitutionalTrigger', institutionalTriggerSchema);
