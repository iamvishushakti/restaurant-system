const mongoose = require('mongoose');

const WaiterCallSchema = new mongoose.Schema(
  {
    callId: { type: String, required: true, unique: true, index: true },
    tableNo: { type: String, required: true, index: true },
    requestType: { type: String, default: 'water' },
    requestLabel: { type: String, default: 'Water Please' },
    note: { type: String, default: '' },
    customerEmail: { type: String, default: '' },
    status: {
      type: String,
      enum: ['PENDING', 'ATTENDING', 'RESOLVED'],
      default: 'PENDING',
      index: true,
    },
    handledBy: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

const WaiterCall = mongoose.models.WaiterCall || mongoose.model('WaiterCall', WaiterCallSchema);

module.exports = WaiterCall;
