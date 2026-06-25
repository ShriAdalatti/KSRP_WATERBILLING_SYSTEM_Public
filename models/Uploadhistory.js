const mongoose=require("mongoose");

const UploadHistorySchema= new mongoose.Schema({

fileName: {
        type: String,
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

    totalRecords: {
        type: Number,
        default: 0
    },

    validRecords: {
        type: Number,
        default: 0
    },

    duplicateRecords: {
        type: Number,
        default: 0
    },

    uploadedBy: {
        type: String,
        default: "Administrator"
    },

    uploadedAt: {
        type: Date,
        default: Date.now
    }

});

module.exports =
mongoose.model(
    "UploadHistory",
    UploadHistorySchema
);