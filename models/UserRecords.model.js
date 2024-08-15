const mongoose = require('mongoose');

const userRecordSchema = new mongoose.Schema({
    songName: {
        type: String,
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    profit: {
        type: Number,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Assuming you have a User model
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'], // Example statuses
        default: 'pending'
    }
});

const UserRecord = mongoose.model('UserRecord', userRecordSchema);

module.exports = UserRecord;
