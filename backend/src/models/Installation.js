const mongoose = require('mongoose');

const installationSchema = new mongoose.Schema({
  equipment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Bike', required: true, index: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tracker_type: { type: String, enum: ['tag', 'gps'], required: true, index: true },
  installation_required: { type: Boolean, default: true },
  registered_at: { type: Date, default: Date.now },
  min_installation_date: { type: Date, required: true },
  installation_status: {
    type: String,
    enum: [
      'cadastro_realizado',
      'plano_ativo',
      'dispositivo_em_preparacao',
      'instalacao_agendada',
      'instalado',
      'cancelado',
    ],
    default: 'plano_ativo',
    index: true,
  },
  installation_date: { type: Date, default: null },
  installation_time: { type: String, default: '' },
  installation_address: { type: String, default: '' },
  adhesive_reserved: { type: Boolean, default: true },
  adhesive_stock_reserved: { type: Boolean, default: false },
  device_reserved: { type: Boolean, default: false },
  stock_consumed: { type: Boolean, default: false },
  device_serial_number: { type: String, default: null },
  installed_at: { type: Date, default: null },
  notes: { type: String, default: '' },
}, { timestamps: true });

installationSchema.index({ equipment_id: 1 }, { unique: true });
installationSchema.index({ installation_date: 1, installation_time: 1, installation_status: 1 });

installationSchema.set('toJSON', {
  virtuals: true,
  transform: (_document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    return returnedObject;
  },
});

module.exports = mongoose.model('Installation', installationSchema);
