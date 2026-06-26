const mongoose = require('mongoose');

const partnerStoreSchema = new mongoose.Schema({
  nome_fantasia: { type: String, required: true, trim: true },
  razao_social: { type: String, default: '', trim: true },
  cnpj: { type: String, default: '', trim: true },
  responsavel: { type: String, default: '', trim: true },
  telefone_whatsapp: { type: String, default: '', trim: true },
  email: { type: String, default: '', trim: true, lowercase: true },
  endereco: { type: String, default: '', trim: true },
  cidade: { type: String, default: 'Balneario Camboriu', trim: true },
  codigo_parceiro: { type: String, required: true, unique: true, index: true, trim: true, uppercase: true },
  percentual_comissao: { type: Number, default: 10, min: 0, max: 100 },
  status: { type: String, enum: ['ativa', 'inativa'], default: 'ativa', index: true },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'partner_stores',
});

partnerStoreSchema.pre('validate', function normalizarCodigo(next) {
  if (this.codigo_parceiro) {
    this.codigo_parceiro = String(this.codigo_parceiro)
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  next();
});

module.exports = mongoose.model('PartnerStore', partnerStoreSchema);
