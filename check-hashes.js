require('dotenv').config();
const mongoose = require('mongoose');
const Certificate = require('./models/Certificate');

async function checkHashes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const certificates = await Certificate.find({}).select('studentId studentName hash');
    
    console.log('\n=== DANH SÁCH HASH VĂN BẰNG ===\n');
    certificates.forEach((cert, index) => {
      console.log(`${index + 1}. MSSV: ${cert.studentId}`);
      console.log(`   Tên: ${cert.studentName}`);
      console.log(`   Hash: ${cert.hash}`);
      console.log('');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkHashes();
