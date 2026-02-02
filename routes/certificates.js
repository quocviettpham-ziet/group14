const express = require('express');
const Certificate = require('../models/Certificate');
const blockchainService = require('../services/blockchain');
const { authenticate, authorize, validate } = require('../middleware/auth');

const router = express.Router();

// Get all certificates (admin only)
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { studentId: new RegExp(search, 'i') },
        { studentName: new RegExp(search, 'i') },
        { degree: new RegExp(search, 'i') },
        { hash: new RegExp(search, 'i') },
      ];
    }

    const certificates = await Certificate.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Certificate.countDocuments(query);

    res.json({
      certificates,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get certificate by student ID (public)
router.get('/student/:studentId', async (req, res) => {
  try {
    const certificate = await Certificate.findOne({ studentId: req.params.studentId });
    if (!certificate) {
      return res.status(404).json({ message: 'Không tìm thấy văn bằng với mã sinh viên này' });
    }

    res.json(certificate);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get certificate by hash (public)
router.get('/:hash', async (req, res) => {
  try {
    const searchHash = req.params.hash;
    
    // Try exact match first
    let certificate = await Certificate.findOne({ hash: searchHash });
    
    // If not found and search is short (like first 12 chars), try partial match
    if (!certificate && searchHash.length < 66) {
      const regex = new RegExp(`^${searchHash}`, 'i');
      certificate = await Certificate.findOne({ hash: regex });
    }
    
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    res.json(certificate);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create certificate (admin only)
router.post('/', 
  authenticate, 
  authorize('admin'),
  validate({
    studentId: { required: true, type: 'string', minLength: 3 },
    studentName: { required: true, type: 'string', minLength: 2 },
    degree: { required: true, type: 'string', minLength: 2 },
    issueDate: { required: true, type: 'string' },
  }),
  async (req, res) => {
    try {
      const { studentId, studentName, degree, issueDate, issuer } = req.body;
      
      // Check if student ID already exists
      const existingStudent = await Certificate.findOne({ studentId });
      if (existingStudent) {
        return res.status(400).json({ message: 'Mã sinh viên đã tồn tại' });
      }

      // Generate hash from certificate data
      const hash = blockchainService.generateHash(studentId, studentName, degree, issueDate);

      // Check if certificate already exists
      const existingCert = await Certificate.findOne({ hash });
      if (existingCert) {
        return res.status(400).json({ message: 'Certificate already exists' });
      }

      // Issue certificate on blockchain
      let blockchainTxHash = null;
      try {
        const bcResult = await blockchainService.issueCertificate(
          hash,
          studentName,
          degree,
          issueDate
        );
        blockchainTxHash = bcResult.transactionHash;
      } catch (bcError) {
        console.error('Blockchain error:', bcError.message);
        // Continue without blockchain if it fails
      }

      // Save to database
      const certificate = new Certificate({
        hash,
        studentId,
        studentName,
        degree,
        issueDate,
        issuer: issuer || 'Đại học Công Nghệ',
        blockchainTxHash,
      });

      await certificate.save();
      res.status(201).json(certificate);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// Update certificate (admin only)
router.put('/:hash', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { studentId, studentName, degree } = req.body;
    
    const certificate = await Certificate.findOne({ hash: req.params.hash });
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    if (certificate.status === 'REVOKED') {
      return res.status(400).json({ message: 'Cannot update revoked certificate' });
    }

    // Check if new studentId already exists (if changed)
    if (studentId && studentId !== certificate.studentId) {
      const existingStudent = await Certificate.findOne({ 
        studentId, 
        _id: { $ne: certificate._id } 
      });
      if (existingStudent) {
        return res.status(400).json({ message: 'Mã sinh viên đã tồn tại' });
      }
      certificate.studentId = studentId;
    }

    // Update fields
    if (studentName) certificate.studentName = studentName;
    if (degree) certificate.degree = degree;

    await certificate.save();
    res.json(certificate);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Revoke certificate (admin only)
router.put('/:hash/revoke', authenticate, authorize('admin'), async (req, res) => {
  try {
    const certificate = await Certificate.findOne({ hash: req.params.hash });
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    if (certificate.status === 'REVOKED') {
      return res.status(400).json({ message: 'Certificate already revoked' });
    }

    // Revoke on blockchain
    try {
      await blockchainService.revokeCertificate(req.params.hash);
    } catch (bcError) {
      console.error('Blockchain revoke error:', bcError.message);
    }

    certificate.status = 'REVOKED';
    await certificate.save();

    res.json(certificate);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete certificate (admin only)
router.delete('/:hash', authenticate, authorize('admin'), async (req, res) => {
  try {
    const certificate = await Certificate.findOne({ hash: req.params.hash });
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    // Delete from database
    await Certificate.deleteOne({ hash: req.params.hash });

    res.json({ 
      message: 'Certificate deleted successfully',
      deletedCertificate: {
        studentId: certificate.studentId,
        studentName: certificate.studentName,
        degree: certificate.degree,
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reissue certificate (admin only) - restore revoked certificate
router.put('/:hash/reissue', authenticate, authorize('admin'), async (req, res) => {
  try {
    const certificate = await Certificate.findOne({ hash: req.params.hash });
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    if (certificate.status === 'VALID') {
      return res.status(400).json({ message: 'Certificate is already valid' });
    }

    // Restore certificate status
    certificate.status = 'VALID';
    await certificate.save();

    res.json({ 
      message: 'Certificate reissued successfully',
      certificate 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Verify certificate from blockchain by hash
router.get('/:hash/verify', async (req, res) => {
  try {
    const certificate = await Certificate.findOne({ hash: req.params.hash });
    
    // Check blockchain
    let blockchainValid = false;
    let blockchainData = null;
    try {
      blockchainValid = await blockchainService.verifyCertificate(req.params.hash);
      blockchainData = await blockchainService.getCertificate(req.params.hash);
    } catch (bcError) {
      console.error('Blockchain verify error:', bcError.message);
    }

    res.json({
      database: certificate ? {
        exists: true,
        status: certificate.status,
        studentName: certificate.studentName,
        degree: certificate.degree,
        issueDate: certificate.issueDate,
      } : { exists: false },
      blockchain: {
        valid: blockchainValid,
        data: blockchainData,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Verify certificate by certificate information (public endpoint)
router.post('/verify', async (req, res) => {
  try {
    const { studentId, studentName, degree, issueDate } = req.body;
    
    if (!studentId || !studentName || !degree || !issueDate) {
      return res.status(400).json({ 
        message: 'Vui lòng cung cấp đầy đủ thông tin: Mã sinh viên, Tên sinh viên, Bằng cấp, Ngày cấp',
        valid: false 
      });
    }

    // Generate hash from provided information
    const calculatedHash = blockchainService.generateHash(studentId, studentName, degree, issueDate);

    // Find certificate in database by hash
    const certificate = await Certificate.findOne({ hash: calculatedHash });

    if (!certificate) {
      return res.json({
        valid: false,
        message: 'Văn bằng không tồn tại trong hệ thống',
        hash: calculatedHash,
      });
    }

    // Check if certificate is revoked
    if (certificate.status === 'REVOKED') {
      return res.json({
        valid: false,
        message: 'Văn bằng đã bị thu hồi',
        certificate: {
          studentId: certificate.studentId,
          studentName: certificate.studentName,
          degree: certificate.degree,
          issueDate: certificate.issueDate,
          status: certificate.status,
          hash: certificate.hash,
        },
      });
    }

    // Verify on blockchain
    let blockchainValid = false;
    let blockchainData = null;
    try {
      blockchainValid = await blockchainService.verifyCertificate(calculatedHash);
      blockchainData = await blockchainService.getCertificate(calculatedHash);
    } catch (bcError) {
      console.error('Blockchain verify error:', bcError.message);
    }

    // Certificate is valid
    res.json({
      valid: true,
      message: 'Văn bằng hợp lệ',
      certificate: {
        studentId: certificate.studentId,
        studentName: certificate.studentName,
        degree: certificate.degree,
        issueDate: certificate.issueDate,
        issuer: certificate.issuer,
        status: certificate.status,
        hash: certificate.hash,
        blockchainTxHash: certificate.blockchainTxHash,
      },
      blockchain: {
        verified: blockchainValid,
        data: blockchainData,
      },
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Lỗi hệ thống khi xác thực văn bằng', 
      error: error.message,
      valid: false 
    });
  }
});

// Get statistics (admin only)
router.get('/stats/overview', authenticate, authorize('admin'), async (req, res) => {
  try {
    const total = await Certificate.countDocuments();
    const valid = await Certificate.countDocuments({ status: 'VALID' });
    const revoked = await Certificate.countDocuments({ status: 'REVOKED' });
    
    // Get recent certificates
    const recent = await Certificate.find()
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      total,
      valid,
      revoked,
      recent,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;