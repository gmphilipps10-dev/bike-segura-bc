const mongoose = require('mongoose');

const institutionalUserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
  password_hash: { type: String, required: true },
  role: {
    type: String,
    enum: ['institucional_gm', 'institucional_pm', 'admin_bike_segura'],
    required: true,
    index: true,
  },
  institution: {
    type: String,
    enum: ['GMBC', 'PMBC', 'BIKE_SEGURA'],
    required: true,
    index: true,
  },
  department: { type: String, default: '', trim: true },
  phone: { type: String, default: '', trim: true },
  badgeNumber: { type: String, default: '', trim: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
  lastLoginAt: { type: Date, default: null },
  createdBy: { type: String, default: '' },
  updatedBy: { type: String, default: '' },
}, { timestamps: true });

institutionalUserSchema.set('toJSON', {
  transform: (_document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject.password_hash;
    return returnedObject;
  },
});

module.exports = mongoose.model('InstitutionalUser', institutionalUserSchema);
