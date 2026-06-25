const mongoose = require('mongoose');

const planoConfigSchema = new mongoose.Schema({
  chave: { type: String, unique: true, default: 'principal' },
  modeloCobranca: { type: String, default: 'anual-v1' },
  precosCentavos: {
    bronze: { type: Number, required: true, default: 5000 },
    prata: { type: Number, required: true, default: 15000 },
    ouro: { type: Number, required: true, default: 30000 },
    diamante: { type: Number, required: true, default: 45000 },
  },
}, { timestamps: true });

module.exports = mongoose.model('PlanoConfig', planoConfigSchema);
