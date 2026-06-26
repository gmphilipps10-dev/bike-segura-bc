const mongoose = require('mongoose');

const protectionSessionSchema = new mongoose.Schema({
  equipment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Bike', required: true, index: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  active: { type: Boolean, default: true, index: true },
  radius_meters: { type: Number, required: true, min: 5, max: 100 },
  initial_latitude: { type: Number, required: true },
  initial_longitude: { type: Number, required: true },
  activated_at: { type: Date, default: Date.now },
  deactivated_at: { type: Date, default: null },
  last_checked_at: { type: Date, default: null },
  outside_detected_at: { type: Date, default: null },
  alert_triggered: { type: Boolean, default: false, index: true },
  alert_triggered_at: { type: Date, default: null },
  last_distance_meters: { type: Number, default: null },
}, {
  collection: 'protection_sessions',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

protectionSessionSchema.index({ equipment_id: 1, active: 1 });
protectionSessionSchema.index({ user_id: 1, active: 1 });
protectionSessionSchema.index({ updated_at: -1 });

protectionSessionSchema.set('toJSON', {
  virtuals: true,
  transform: (_document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    return returnedObject;
  },
});

module.exports = mongoose.model('ProtectionSession', protectionSessionSchema);
