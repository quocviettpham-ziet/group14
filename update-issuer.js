require('dotenv').config();
const mongoose = require('mongoose');
const Certificate = require('./models/Certificate');

async function updateIssuer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Cập nhật tất cả văn bằng với issuer mới
    const result = await Certificate.updateMany(
      {},
      { $set: { issuer: 'Đại học Công Nghệ' } }
    );
    
    console.log(`\n✅ Đã cập nhật ${result.modifiedCount} văn bằng`);
    console.log('Issuer mới: Đại học Công Nghệ\n');
    
    // Hiển thị kết quả
    const certificates = await Certificate.find({}).select('studentId studentName issuer');
    console.log('=== DANH SÁCH VĂN BẰNG SAU KHI CẬP NHẬT ===\n');
    certificates.forEach((cert, index) => {
      console.log(`${index + 1}. ${cert.studentName} (${cert.studentId})`);
      console.log(`   Đơn vị cấp: ${cert.issuer}\n`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateIssuer();
