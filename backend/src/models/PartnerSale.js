const mongoose = require('mongoose');

const manualChangeSchema = new mongoose.Schema({
  changed_at: { type: Date, default: Date.now },
  changed_by: { type: mongoose.Schema.Types.Mixed, default: null },
  changed_by_name: { type: String, default: '' },
  from_partner_store_id: { type: mongoose.Schema.Types.ObjectId, ref: 'PartnerStore', default: null },
  from_codigo_parceiro: { type: String, default: '' },
  to_partner_store_id: { type: mongoose.Schema.Types.ObjectId, ref: 'PartnerStore', default: null },
  to_codigo_parceiro: { type: String, default: '' },
  observation: { type: String, default: '' },
}, { _id: false });

const partnerSaleSchema = new mongoose.Schema({
  partner_store_id: { type: mongoose.Schema.Types.ObjectId, ref: 'PartnerStore', required: true, index: true },
  codigo_parceiro: { type: String, required: true, index: true, uppercase: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  equipment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Bike', default: null, index: true },
  plan_id: { type: String, required: true },
  plan_name: { type: String, required: true },
  gross_amount: { type: Number, required: true, default: 0 }, // centavos
  net_amount: { type: Number, default: 0 }, // centavos, quando o gateway informar
  commission_percentage: { type: Number, default: 10 },
  commission_amount: { type: Number, required: true, default: 0 }, // centavos
  payment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Pagamento', required: true, index: true },
  asaas_payment_id: { type: String, default: '', index: true },
  payment_status: { type: String, default: 'pago', index: true },
  sale_status: { type: String, enum: ['confirmed', 'cancelled', 'refunded'], default: 'confirmed', index: true },
  sold_at: { type: Date, default: Date.now, index: true },
  commission_status: { type: String, enum: ['pending', 'paid', 'cancelled'], default: 'pending', index: true },
  paid_at: { type: Date, default: null },
  paid_by: { type: mongoose.Schema.Types.Mixed, default: null },
  paid_by_name: { type: String, default: '' },
  payment_observation: { type: String, default: '' },
  manual_change_logs: [manualChangeSchema],
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'partner_sales',
});

partnerSaleSchema.index(
  { payment_id: 1, asaas_payment_id: 1 },
  { unique: true, partialFilterExpression: { asaas_payment_id: { $type: 'string', $ne: '' } } }
);

module.exports = mongoose.model('PartnerSale', partnerSaleSchema);
