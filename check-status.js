require('dotenv').config();
const mongoose = require('mongoose');
const Certificate = require('./models/Certificate');

async function checkStatus() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const certificates = await Certificate.find({}).select('studentId studentName hash status');
    
    console.log('\n=== DANH SÁCH VĂN BẰNG & TRẠNG THÁI ===\n');
    certificates.forEach((cert, index) => {
      console.log(`${index + 1}. MSSV: ${cert.studentId}`);
      console.log(`   Tên: ${cert.studentName}`);
      console.log(`   Hash: ${cert.hash}`);
      console.log(`   Trạng thái: ${cert.status}`);
      console.log('');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkStatus();
