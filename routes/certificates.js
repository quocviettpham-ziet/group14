const express = require('express');
const jwt = require('jsonwebtoken');
const Certificate = require('../models/Certificate');

const router = express.Router();

// Middleware to verify JWT
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Get all certificates (admin only)
router.get('/', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const certificates = await Certificate.find();
    res.json(certificates);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get certificate by hash (public)
router.get('/:hash', async (req, res) => {
  try {
    const certificate = await Certificate.findOne({ hash: req.params.hash });
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    res.json(certificate);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create certificate (issuer only)
router.post('/', authenticate, async (req, res) => {
  try {
    const { hash, studentName, degree, issueDate, issuer, blockchainTxHash } = req.body;

    const existingCert = await Certificate.findOne({ hash });
    if (existingCert) {
      return res.status(400).json({ message: 'Certificate already exists' });
    }

    const certificate = new Certificate({
      hash,
      studentName,
      degree,
      issueDate,
      issuer,
      blockchainTxHash,
    });

    await certificate.save();
    res.status(201).json(certificate);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update certificate status (issuer only)
router.put('/:hash', authenticate, async (req, res) => {
  try {
    const { status } = req.body;

    const certificate = await Certificate.findOne({ hash: req.params.hash });
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    // Check if user is the issuer (simplified, in real app check wallet address)
    if (req.user.role !== 'admin' && certificate.issuer !== req.user.address) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    certificate.status = status;
    await certificate.save();

    res.json(certificate);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;