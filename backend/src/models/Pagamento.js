const mongoose = require('mongoose');

const pagamentoSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  userCpf: { type: String, default: '' },
  bikeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bike', default: null },
  bikeName: { type: String, default: '' },
  bikeBrand: { type: String, default: '' },
  bikeSerie: { type: String, default: '' },
  plano: { type: String, enum: ['bronze', 'prata', 'ouro', 'diamante'], required: true },
  valor: { type: Number, required: true }, // em centavos
  valorMensal: { type: Number, default: 0 },
  valorTotal: { type: Number, default: 0 },
  frequencia: { type: String, enum: ['mensal', 'anual', 'legado'], default: 'legado' },
  quantidadeCobrancas: { type: Number, default: 1 },
  cobrancaAtiva: { type: Boolean, default: false },
  asaasId: { type: String, default: '' }, // ID da cobranca no Asaas
  asaasSubscriptionId: { type: String, default: '' },
  externalReference: { type: String, default: '' },
  status: { type: String, enum: ['pendente', 'pago', 'atrasado', 'cancelado'], default: 'pendente' },
  metodoPagamento: { type: String, default: '' }, // PIX, BOLETO, CREDIT_CARD
  dataVencimento: { type: Date, required: true },
  dataPagamento: { type: Date, default: null },
  linkPagamento: { type: String, default: '' },
  pixQrCode: { type: String, default: '' },
  pixPayload: { type: String, default: '' },
  boletoUrl: { type: String, default: '' },
  recebimentos: [{
    asaasId: { type: String },
    status: { type: String },
    valor: { type: Number },
    dataVencimento: { type: Date },
    dataPagamento: { type: Date, default: null },
  }],
  historico: [{
    data: { type: Date, default: Date.now },
    status: { type: String },
    descricao: { type: String }
  }]
}, { timestamps: true });

// Impede duas contratacoes simultaneas para o mesmo equipamento, inclusive
// quando dois cliques chegam quase ao mesmo tempo.
pagamentoSchema.index(
  { bikeId: 1, cobrancaAtiva: 1 },
  { unique: true, partialFilterExpression: { cobrancaAtiva: true } }
);

module.exports = mongoose.model('Pagamento', pagamentoSchema);
