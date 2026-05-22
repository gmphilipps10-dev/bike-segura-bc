const mongoose = require('mongoose');

const bikeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  brand: { type: String, required: true },
  serie: { type: String, required: true },
  color: { type: String, required: true },
  value: { type: String, default: '' },
  photo: { type: String, default: null },
  protected: { type: Boolean, default: true },
  location: { type: String, default: 'Balneário Camboriú, SC' },
  lastSeen: { type: String, default: 'Agora' },
  rastreamento: { type: String, default: '' },
  plataformaTag: { type: String, default: '' },
  caracteristicas: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Bike', bikeSchema);
