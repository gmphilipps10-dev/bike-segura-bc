const mongoose = require('mongoose');

const pagamentoSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  userCpf: { type: String, default: '' },
  plano: { type: String, enum: ['bronze', 'prata', 'ouro', 'diamante'], required: true },
  valor: { type: Number, required: true }, // em centavos
  asaasId: { type: String, default: '' }, // ID da cobranca no Asaas
  status: { type: String, enum: ['pendente', 'pago', 'atrasado', 'cancelado'], default: 'pendente' },
  metodoPagamento: { type: String, default: '' }, // PIX, BOLETO, CREDIT_CARD
  dataVencimento: { type: Date, required: true },
  dataPagamento: { type: Date, default: null },
  linkPagamento: { type: String, default: '' },
  pixQrCode: { type: String, default: '' },
  pixPayload: { type: String, default: '' },
  boletoUrl: { type: String, default: '' },
  historico: [{
    data: { type: Date, default: Date.now },
    status: { type: String },
    descricao: { type, String }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Pagamento', pagamentoSchema);
