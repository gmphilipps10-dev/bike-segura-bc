const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  cpf: { type: String, default: '' },
  rg: { type: String, default: '' },
  nascimento: { type: String, default: '' },
  endereco: { type: String, default: '' },
  contatoEmergencia: { type: String, default: '' },
  plano: { type: String, enum: ['free', 'bronze', 'prata', 'ouro', 'diamante'], default: 'free' },
  indicacoes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isAdmin: { type: Boolean, default: false },
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
