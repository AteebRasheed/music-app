const mongoose = require('mongoose');

const RechargeRequestSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true,
        unique: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    username: {
        type: String,
        required: true,
    },
    phoneNumber: {
        type: String,
        required: true,
    },
    transactionAmount: {
        type: Number,
        required: true,
    },
    requestTime: {
        type: Date,
        default: Date.now,
    },
    processingTime: {
        type: Date,
        required: true,
    },
});

const RechargeRequest = mongoose.model('RechargeRequest', RechargeRequestSchema);

module.exports = RechargeRequest;
