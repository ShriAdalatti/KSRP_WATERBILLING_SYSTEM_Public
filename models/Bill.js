const mongoose = require('mongoose');

const BillSchema = new mongoose.Schema({
    billId: {
        type: String,
        unique: true,
    },

    name: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true
    },

    block: {
        type: String,
        required: true
    },

    room: {
        type: Number,
        required: true
    },

    previousReading: {
        type: Number,
        default: 0
    },

    currentReading: {
        type: Number,
        default: 0
    },
    units:{
        type:Number},

    amount: {
        type: Number,
        required: true
    },

    month: {
        type: String,
        required: true
    },
year: {
    type: Number,
    required: true
},

uploadedBy: {
    type: String,
    default: "Administrator"
},

uploadedAt: {
    type: Date,
    default: Date.now
},

    status: {
        type: String,
        default: "Unpaid"
    }
});

module.exports = mongoose.model("Bill", BillSchema);