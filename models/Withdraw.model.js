const mongoose = require('mongoose');

const WithdrawalSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true,
        unique: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    username: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    requestedAmount: {
        type: Number,
        required: true
    },
    balance: {
        type: Number,
        required: true
    },
    handlingFee: {
        type: Number,
        default: 0
    },
    requestTime: {
        type: Date,
        default: Date.now
    },
    processingTime: {
        type: Date,
        required: true
    },
    network: {
        type: String,
        default: null,
    },
    wallet: {
        type: String,
        default: null,
    },
    status: {
        type: String,
        enum: ['Pending', 'Processed', 'Rejected'],
        default: 'Pending'
    }
});

const Withdrawal = mongoose.model('Withdrawal', WithdrawalSchema);

module.exports = Withdrawal;
