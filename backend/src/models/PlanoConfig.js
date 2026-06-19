const mongoose = require('mongoose');

const planoConfigSchema = new mongoose.Schema({
  chave: { type: String, unique: true, default: 'principal' },
  modeloCobranca: { type: String, default: 'mensal-v1' },
  precosCentavos: {
    bronze: { type: Number, required: true, default: 417 },
    prata: { type: Number, required: true, default: 1250 },
    ouro: { type: Number, required: true, default: 2500 },
    diamante: { type: Number, required: true, default: 3750 },
  },
}, { timestamps: true });

module.exports = mongoose.model('PlanoConfig', planoConfigSchema);
