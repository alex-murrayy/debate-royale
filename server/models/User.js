const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  level: {
    type: Number,
    default: 1
  },
  experience: {
    type: Number,
    default: 0
  },
  rank: {
    type: String,
    enum: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master', 'Grandmaster'],
    default: 'Bronze'
  },
  wins: {
    type: Number,
    default: 0
  },
  losses: {
    type: Number,
    default: 0
  },
  profilePicture: {
    type: String,
    default: 'default-1'
  },
  unlockedPictures: [{
    type: String
  }],
  selectedVoice: {
    type: String,
    default: 'default'
  },
  unlockedVoices: [{
    type: String
  }],
  coins: {
    type: Number,
    default: 100
  },
  gems: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to add experience and level up
userSchema.methods.addExperience = function(amount) {
  this.experience += amount;
  const expForNextLevel = this.level * 100;
  if (this.experience >= expForNextLevel) {
    this.level += 1;
    this.experience -= expForNextLevel;
    this.updateRank();
    return { leveledUp: true, newLevel: this.level };
  }
  return { leveledUp: false };
};

// Method to update rank based on level
userSchema.methods.updateRank = function() {
  if (this.level >= 50) this.rank = 'Grandmaster';
  else if (this.level >= 40) this.rank = 'Master';
  else if (this.level >= 30) this.rank = 'Diamond';
  else if (this.level >= 20) this.rank = 'Platinum';
  else if (this.level >= 10) this.rank = 'Gold';
  else if (this.level >= 5) this.rank = 'Silver';
  else this.rank = 'Bronze';
};

module.exports = mongoose.model('User', userSchema);

