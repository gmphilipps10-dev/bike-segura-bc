const mongoose = require('mongoose');

const prePrintedQRSchema = new mongoose.Schema({
  // Numero sequencial legivel para o adesivo fisico (ex: BSBC-0001)
  stickerNumber: { type: String, required: true, unique: true, index: true },

  // Hash unico usado na URL publica (ex: a7x9k2m8f3ab)
  hash: { type: String, required: true, unique: true, index: true },

  // Status: disponivel / vinculado / inativo
  status: { type: String, enum: ['disponivel', 'vinculado', 'inativo'], default: 'disponivel' },

  // Dados de vinculacao
  bikeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bike', default: null },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  vinculadoAt: { type: Date, default: null },

  // Historico permanente do ultimo equipamento antes da inativacao.
  // O adesivo fisico nunca volta ao estoque, mas o painel preserva a auditoria.
  ultimoVinculo: {
    bikeId: { type: mongoose.Schema.Types.ObjectId, default: null },
    userId: { type: mongoose.Schema.Types.ObjectId, default: null },
    equipamentoNome: { type: String, default: '' },
    equipamentoMarca: { type: String, default: '' },
    equipamentoTipo: { type: String, default: '' },
    equipamentoSerie: { type: String, default: '' },
    equipamentoCor: { type: String, default: '' },
    proprietarioNome: { type: String, default: '' },
    vinculadoAt: { type: Date, default: null },
    inativadoAt: { type: Date, default: null },
    motivo: { type: String, default: '' },
  },

  // Controle de lote para impressao
  lote: { type: String, default: 'default' },

  // Contador de scans (consultas publicas)
  scanCount: { type: Number, default: 0 },
  lastScanAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('PrePrintedQR', prePrintedQRSchema);
