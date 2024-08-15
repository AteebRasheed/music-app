const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    registrationTime: {
        type: Date,
        default: Date.now,
    },
    clicks: {
        type: Number,
        default: 0,
    },
    frozenAmount: {
        type: Number,
        default: 0,
    },
    creditScore: {
        type: Number,
        default: 100,
    },
    balance: {
        type: Number,
        default: 15,
    },
    status: {
        type: Boolean,
        default: false,
    },
    sequenceId: Number,
    code: String,
    fixedTask: Number,
    membershipLevel: String,
    phoneNumber: String,
    tradingStatus: String,
    isProxy: String,
    parentId: String,
    withdrawlPassword: String,
    totalProfit: Number,
    todayProfit: Number,
    commission: Number,
    cardItem: Number,
    cardName: String,
    assignedTasks: {
        type: Number,
        default: 40
    }


});

// Encrypt password before saving user
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

const User = mongoose.model('Users1', UserSchema);

module.exports = User;
