const mongoose = require('mongoose');

const pushSubscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  endpoint: { type: String, required: true, unique: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true }
  },
  ativo: { type: Boolean, default: true }
}, { timestamps: true });

// Index composto para buscar subscriptions ativas de um usuario
pushSubscriptionSchema.index({ userId: 1, ativo: 1 });

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);
