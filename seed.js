require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Certificate = require('./models/Certificate');
const blockchainService = require('./services/blockchain');

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Initialize blockchain service
    await blockchainService.initialize();
    console.log('Blockchain service initialized');

    // Check if admin user exists
    const existingAdmin = await User.findOne({ username: 'admin' });
    if (!existingAdmin) {
      // Create admin user
      const adminUser = new User({
        username: 'admin',
        password: 'admin123', // Will be hashed by pre-save hook
        email: 'admin@vov.edu.vn',
        role: 'admin',
      });
      await adminUser.save();
      console.log('Admin user created successfully');
    } else {
      console.log('Admin user already exists');
    }

    // Check if student user exists
    const existingStudent = await User.findOne({ username: 'student' });
    if (!existingStudent) {
      // Create sample student user
      const studentUser = new User({
        username: 'student',
        password: 'student123',
        email: 'student@vov.edu.vn',
        role: 'student',
      });
      await studentUser.save();
      console.log('Student user created successfully');
    } else {
      console.log('Student user already exists');
    }

    // Create sample certificates
    const sampleCertificates = [
      {
        studentId: '223001',
        studentName: 'Nguyễn Văn A',
        degree: 'Cử Nhân Công Nghệ Thông Tin',
        issueDate: '2024-06-15',
        issuer: 'Đại học Công Nghệ',
      },
      {
        studentId: '223002',
        studentName: 'Đổng Ngọc Oanh',
        degree: 'Cử Nhân Khoa Học Máy Tính',
        issueDate: '2024-06-15',
        issuer: 'Đại học Công Nghệ',
      },
      {
        studentId: '223003',
        studentName: 'Trần Thị C',
        degree: 'Cử Nhân Kỹ Thuật Phần Mềm',
        issueDate: '2024-06-15',
        issuer: 'Đại học Công Nghệ',
      },
      {
        studentId: '223004',
        studentName: 'Phạm Quốc Việt',
        degree: 'Cử Nhân An Toàn Thông Tin',
        issueDate: '2024-06-15',
        issuer: 'Đại học Công Nghệ',
      },
    ];

    for (const certData of sampleCertificates) {
      // Check if certificate already exists
      const existing = await Certificate.findOne({ studentId: certData.studentId });
      if (existing) {
        console.log(`Certificate for ${certData.studentId} already exists`);
        continue;
      }

      // Generate hash
      const hash = blockchainService.generateHash(
        certData.studentId,
        certData.studentName,
        certData.degree,
        certData.issueDate
      );

      // Issue on blockchain
      try {
        const tx = await blockchainService.issueCertificate(
          hash,
          certData.studentName,
          certData.degree,
          certData.issueDate
        );
        
        // Save to database
        const certificate = new Certificate({
          ...certData,
          hash,
          blockchainTxHash: tx.hash,
          status: 'VALID',
        });

        await certificate.save();
        console.log(`Certificate created for ${certData.studentName} (${certData.studentId})`);
      } catch (error) {
        console.error(`Error creating certificate for ${certData.studentId}:`, error.message);
      }
    }

    console.log('\n✅ Database seeded successfully!');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    mongoose.connection.close();
  }
}

seedDatabase();