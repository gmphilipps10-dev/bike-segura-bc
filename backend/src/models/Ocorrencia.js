const mongoose = require('mongoose');

const ocorrenciaSchema = new mongoose.Schema({
  // Tipo: 'manual' = inserida pelo admin via WhatsApp | 'monitorado' = alerta de usuario
  tipo: { type: String, enum: ['manual', 'monitorado'], required: true, default: 'manual' },
  
  // Dados do local
  endereco: { type: String, required: true },
  bairro: { type: String, default: '' },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  
  // Dados da ocorrencia
  titulo: { type: String, default: '' },
  descricao: { type: String, default: '' },
  dataOcorrencia: { type: Date, default: Date.now },
  
  // Se for monitorado, vincula ao equipamento
  bikeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bike', default: null },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  
  // Dados do veiculo (se informado)
  veiculoTipo: { type: String, default: '' },
  veiculoCor: { type: String, default: '' },
  veiculoMarca: { type: String, default: '' },
  
  // Status
  status: { type: String, enum: ['ativo', 'resolvido', 'falso'], default: 'ativo' },
  
  // Origem da informacao (para manual)
  fonte: { type: String, default: 'WhatsApp' },
  
  // Contador de confirmacoes da comunidade
  confirmacoes: { type: Number, default: 1 },
  
}, { timestamps: true });

// Index para busca geografica
ocorrenciaSchema.index({ lat: 1, lng: 1 });
ocorrenciaSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Ocorrencia', ocorrenciaSchema);
