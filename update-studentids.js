require('dotenv').config();
const mongoose = require('mongoose');
const Certificate = require('./models/Certificate');

async function updateStudentIds() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Lấy tất cả certificates không có studentId
    const certificates = await Certificate.find({ 
      $or: [
        { studentId: { $exists: false } },
        { studentId: null },
        { studentId: '' }
      ]
    });

    console.log(`Found ${certificates.length} certificates without studentId`);

    if (certificates.length === 0) {
      console.log('All certificates already have studentId');
      return;
    }

    // Cập nhật từng certificate với mã sinh viên ngẫu nhiên
    let counter = 223001;
    for (const cert of certificates) {
      // Tạo mã sinh viên dựa trên index hoặc random
      const studentId = String(counter).padStart(6, '2');
      
      cert.studentId = studentId;
      await cert.save();
      
      console.log(`Updated certificate ${cert.hash.substring(0, 10)}... with studentId: ${studentId}`);
      counter++;
    }

    console.log('All certificates updated successfully!');

  } catch (error) {
    console.error('Error updating studentIds:', error);
  } finally {
    mongoose.connection.close();
  }
}

updateStudentIds();
