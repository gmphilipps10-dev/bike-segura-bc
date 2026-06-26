const mongoose = require('mongoose');

const eventTypes = [
  'protection_activated',
  'protection_deactivated',
  'outside_area_detected',
  'outside_area_cancelled',
  'protection_alert_triggered',
  'siren_silenced',
];

const protectionEventSchema = new mongoose.Schema({
  protection_session_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ProtectionSession', required: true, index: true },
  equipment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Bike', required: true, index: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  event_type: { type: String, enum: eventTypes, required: true, index: true },
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null },
  distance_meters: { type: Number, default: null },
  radius_meters: { type: Number, default: null },
}, {
  collection: 'protection_events',
  timestamps: { createdAt: 'created_at', updatedAt: false },
});

protectionEventSchema.index({ created_at: -1 });
protectionEventSchema.index({ equipment_id: 1, created_at: -1 });

protectionEventSchema.set('toJSON', {
  virtuals: true,
  transform: (_document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    return returnedObject;
  },
});

module.exports = mongoose.model('ProtectionEvent', protectionEventSchema);
