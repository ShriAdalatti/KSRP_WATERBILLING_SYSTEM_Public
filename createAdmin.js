const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Admin = require("./models/Admin");

mongoose.connect("mongodb://127.0.0.1:27017/waterbillDB");

async function createAdmin() {

    const hashedPassword = await bcrypt.hash("12345678", 10);

    const admin = new Admin({
        adminId: "admin",
        email: "admin@ksrp.in",
        password: hashedPassword
    });

    await admin.save();

    console.log("Admin Created Successfully ✅");

    mongoose.connection.close();
}

createAdmin();