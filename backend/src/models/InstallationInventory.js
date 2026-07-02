const mongoose = require('mongoose');

const installationInventorySchema = new mongoose.Schema({
  item: { type: String, enum: ['tag', 'gps', 'adhesive'], required: true, unique: true, index: true },
  label: { type: String, required: true },
  current_quantity: { type: Number, default: 0, min: 0 },
  minimum_quantity: { type: Number, default: 0, min: 0 },
  reserved_quantity: { type: Number, default: 0, min: 0 },
  updated_by: { type: String, default: '' },
}, { timestamps: true });

installationInventorySchema.set('toJSON', {
  virtuals: true,
  transform: (_document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    returnedObject.available_quantity = Math.max(
      0,
      Number(returnedObject.current_quantity || 0) - Number(returnedObject.reserved_quantity || 0)
    );
    returnedObject.below_minimum = Number(returnedObject.current_quantity || 0) <= Number(returnedObject.minimum_quantity || 0);
    return returnedObject;
  },
});

module.exports = mongoose.model('InstallationInventory', installationInventorySchema);
