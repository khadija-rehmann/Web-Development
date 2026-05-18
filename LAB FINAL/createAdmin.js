const mongoose = require('mongoose');
const User = require('./models/User');

async function createAdmin() {
  await mongoose.connect('mongodb://localhost:27017/limelight', { useNewUrlParser: true, useUnifiedTopology: true });
  try {
    const existing = await User.findOne({ email: 'admin@limelight.com' });
    if (existing) {
      console.log('Admin already exists');
    } else {
      const admin = new User({ name: 'Admin', email: 'admin@limelight.com', password: 'admin123', role: 'admin' });
      await admin.save();
      console.log('Admin user created');
    }
  } catch (err) {
    console.error('Error creating admin:', err);
  } finally {
    mongoose.connection.close();
  }
}

createAdmin();
