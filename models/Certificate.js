const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  hash: {
    type: String,
    required: true,
    unique: true,
  },
  studentId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  studentName: {
    type: String,
    required: true,
  },
  degree: {
    type: String,
    required: true,
  },
  issueDate: {
    type: String,
    required: true,
  },
  issuer: {
    type: String, // Address of issuer
    required: true,
  },
  status: {
    type: String,
    enum: ['VALID', 'REVOKED'],
    default: 'VALID',
  },
  blockchainTxHash: {
    type: String, // Transaction hash from blockchain
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Certificate', certificateSchema);