const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
    _id: String,
    sequence_value: Number
});

const Counter = mongoose.model('Counter', counterSchema);

module.exports = Counter;