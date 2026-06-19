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
  location: { type: String, default: 'Balneario Camboriu, SC' },
  lastSeen: { type: String, default: 'Agora' },
  rastreamento: { type: String, default: '' },
  plataformaTag: { type: String, default: '' },
  caracteristicas: { type: String, default: '' },
  hash: { type: String, unique: true, sparse: true, index: true },
  status: { type: String, enum: ['normal', 'furto', 'recuperada'], default: 'normal' },
  alertDate: { type: Date, default: null },
  boNumber: { type: String, default: '' },
  scanCount: { type: Number, default: 0 },
  lastScanAt: { type: Date, default: null },
  plano: { type: String, enum: ['free', 'bronze', 'prata', 'ouro', 'diamante'], default: 'free' },
  planoAtivo: { type: Boolean, default: false },
  planoDataAtivacao: { type: Date, default: null },
  planoDataExpiracao: { type: Date, default: null },
  pagamentoAtualId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pagamento', default: null },
}, { timestamps: true });

bikeSchema.set('toJSON', {
  virtuals: true,
  transform: (_document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    return returnedObject;
  },
});

module.exports = mongoose.model('Bike', bikeSchema);
