const mongoose = require('mongoose');

const historicoRastreamentoSchema = new mongoose.Schema({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
  velocidade: { type: Number, default: 0 },
  bateria: { type: Number, default: 100 }
}, { _id: false });

const sinistroSchema = new mongoose.Schema({
  bikeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bike', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tipo: { type: String, enum: ['roubo', 'furto', 'tentativa_roubo', 'apropriacao_indebita'], required: true },
  status: { type: String, enum: ['aberto', 'suspenso', 'fechado'], default: 'aberto', index: true },
  statusRecuperacao: { type: String, enum: ['em_andamento', 'veiculo_encontrado', 'falso_positivo', 'sem_exito', 'recuperado'], default: 'em_andamento' },
  prontaResposta: { type: String, enum: ['acionada', 'disponivel', 'nao_aplicavel'], default: 'disponivel' },
  dataOcorrencia: { type: Date, required: true },
  dataCriacao: { type: Date, default: Date.now },
  dataAtualizacao: { type: Date, default: Date.now },
  dataFechamento: { type: Date, default: null },
  dataSuspensao: { type: Date, default: null },
  localOcorrencia: { type: String, required: true },
  coordenadasOcorrencia: { lat: { type: Number, default: null }, lng: { type: Number, default: null } },
  descricao: { type: String, default: '' },
  boletimOcorrencia: { type: String, default: '' },
  fotos: [{ type: String }],
  coordenadasAtual: { lat: { type: Number, default: null }, lng: { type: Number, default: null } },
  ultimaAtualizacaoRastreador: { type: Date, default: null },
  historicoRastreamento: [historicoRastreamentoSchema],
  rastreadorOnline: { type: Boolean, default: false },
  bateriaRastreador: { type: Number, default: 100 },
  responsavel: { type: String, default: '' },
  observacoes: { type: String, default: '' },
  fotosRecuperacao: [{ type: String }],
  veiculoSnapshot: {
    nome: { type: String, default: '' },
    tipo: { type: String, default: '' },
    marca: { type: String, default: '' },
    cor: { type: String, default: '' },
    serie: { type: String, default: '' },
    hash: { type: String, default: '' },
    foto: { type: String, default: '' }
  },
  proprietarioSnapshot: {
    nome: { type: String, default: '' },
    telefone: { type: String, default: '' },
    email: { type: String, default: '' }
  },
  diasEmAndamento: { type: Number, default: 0 }
}, { timestamps: true });

sinistroSchema.index({ status: 1, createdAt: -1 });
sinistroSchema.index({ bikeId: 1, status: 1 });
sinistroSchema.index({ userId: 1, status: 1 });
sinistroSchema.index({ tipo: 1, status: 1 });

sinistroSchema.pre('save', function(next) {
  if (this.status === 'aberto' || this.status === 'suspenso') {
    const diff = Math.floor((Date.now() - this.dataOcorrencia.getTime()) / (1000 * 60 * 60 * 24));
    this.diasEmAndamento = diff;
  }
  this.dataAtualizacao = Date.now();
  next();
});

module.exports = mongoose.model('Sinistro', sinistroSchema);
