const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
    adminId: String,
    email: String,
    password: String
});

module.exports = mongoose.model("Admin", adminSchema);