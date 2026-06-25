const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require("body-parser");
const multer = require("multer");
const XLSX = require("xlsx");
const path = require("path");


require("dotenv").config();

// console.log("SESSION_SECRET =", process.env.SESSION_SECRET);

const Bill = require("./models/Bill");   // FIXED
const User = require("./models/user"); // calling the User DB File
const Admin = require("./models/Admin");//calling admin.js to the password or modification of the admin
const UploadHistory =
require("./models/UploadHistory");

const bcrypt = require('bcrypt');

const app = express();
app.use(express.json());

const storage = multer.diskStorage({

    destination: function(req,file,cb){

        cb(null,"uploads/");
    },

    filename: function(req,file,cb){

        cb(
            null,
            Date.now() + "-" +
            file.originalname
        );

    }

});

const upload = multer({
    storage
});

app.use(express.static("Public"));
app.use(bodyParser.urlencoded({ extended: true }));

const session = require("express-session");

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
}));

app.set("view engine", "ejs");

mongoose.connect("mongodb://127.0.0.1:27017/waterbillDB")
    .then(() => console.log("DB Connected ✅"))
    .catch(err => console.log(err));

//HomePage
app.get('/', (req, res) => {
    res.render("homepage");
});

//Adminlogin
app.get('/Admin', (req, res) => {
    res.render("Admin");
});

app.get("/admin_dashboard", isAdmin, async (req,res)=>{

    const pendingPayments =
    await Bill.countDocuments({

        status:
        "Payment Verification Pending"

    });

    res.render(
        "admin_dashboard",
        {
            pendingPayments
        }
    );

});
// Manage Users
app.get("/manage_Users", isAdmin, (req, res) => {
    res.render("manage_Users");
});
//view_Record
app.get("/view_record", isAdmin, (req, res) => {
    res.render("view_record");
});

//Add/Update data
app.get(
    "/add_update_data",
    isAdmin,
    (req,res)=>{

        res.render(
            "add_update_data"
        );

});

//insidemange users deleting user route
app.delete("/admin/users/:id", isAdmin, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id); //deletes the User By its MOngoDB ID
        res.send("User Deleted");
    } catch (err) {
        res.status(500).send("Error deleting user");
    }
});


//User Edit OPtion in Manage User
app.put("/admin/users/:id", isAdmin, async (req, res) => {
    try {
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true } // IMPORTANT
        );

        if (!updatedUser) {
            return res.status(404).send("User not found");
        }

        res.send("User updated successfully");
    } catch (err) {
        console.log(err);
        res.status(500).send("Error updating user");
    }
});
//view_RECORD 
//function to get access only for admins 
function isAdmin(req, res, next) {
    if (req.session && req.session.admin) {
        next(); // allow access
    } else {
        res.status(403).send("Access Denied");
    }
}

//homepage
app.get('/homepage', (req, res) => {
    res.render('homepage');
});

//GetBill
app.post('/getbill', async (req, res) => {
    const block = req.body.block.trim();
    const room = Number(req.body.room);   // IMPORTANT

    const bill = await Bill.findOne({ block, room });

    if (bill) {
        res.render("Bill", { bill });
    } else {
        res.send("Bill not found");
    }
});


//Create User
app.post("/adduser",isAdmin, async (req, res) => {
    try {

        // Check if email already exists
        const existingUser = await User.findOne({
            email: req.body.email.toLowerCase().trim()
        });

        if (existingUser) {
            return res.render("Adduser", {
                message: "Email already exists!"
            });
        }

        const hashedPassword = await bcrypt.hash(
            req.body.password,
            10
        );

        const newUser = new User({
            name: req.body.name,
            block: req.body.block,
            room: req.body.room,
            email: req.body.email.toLowerCase().trim(),
            password: hashedPassword,
            phone: req.body.phone
        });

        await newUser.save();

        res.render("Adduser", {
            message: "User added successfully"
        });

    } catch (err) {

        console.log(err);
        res.send(err.message);
    }
});
//USERLOGINPAGE
app.get("/Userlogin", (req, res) => {
    res.render("Userlogin");
});

//Userlogout
app.get("/user/logout", (req,res)=>{
    req.session.destroy();
    res.redirect("/Userlogin");
});

//validLOgin
app.post("/Userlogin", async (req, res) => {

    const email =
        req.body.email.toLowerCase().trim();

    const password =
        req.body.password;

    const user = await User.findOne({ email });

    if (!user) {
        return res.send("User not found ❌");
    }

    const isMatch =
        await bcrypt.compare(password, user.password);

    if (isMatch) {
        req.session.user = user;
        res.redirect("/Userhome");
    } else {
        res.send("Invalid password ❌");
    }
});

//check it once i was stuck here
app.get("/Userhome", async (req, res) => {

    if (!req.session.user) {
        return res.redirect("/Userlogin");
    }

    const user = req.session.user;

    const latestBill = await Bill.findOne({

        email: user.email

    })
    .sort({ _id: -1 });

    res.render("Userhome", {

        user,
        latestBill

    });

});
//to help_page
app.get("/help", (req, res) => {
    res.render("Help_page");
});

//get user details &&BILLs
app.get("/admin/Bill", isAdmin, async (req, res) => {
    const bills = await Bill.find();
    res.json(bills);
});

app.get("/admin/users", isAdmin, async (req, res) => {
    const users = await User.find();
    res.json(users);
});


//AdminLogin
app.post("/adminlogin", async (req, res) => {

    const { adminId, password } = req.body;

    try {

        const admin = await Admin.findOne({ adminId });

        if (!admin) {
            return res.send("Invalid Admin ID ❌");
        }

        const isMatch = await bcrypt.compare(
            password,
            admin.password
        );

        if (isMatch) {

            req.session.admin = true;
            res.redirect("/admin_dashboard");

        } else {

            res.send("Invalid Password ❌");

        }

    } catch (err) {

        console.log(err);
        res.send("Login Error");

    }
});

//jmp to Adduser
app.get("/Adduser", isAdmin, (req, res) => {
    res.render("Adduser");
});

const QRCode = require("qrcode");

app.get("/paybill/:id", async (req, res) => {

    try {

        const bill = await Bill.findById(
            req.params.id
        );

        if (!bill) {

            return res.send(
                "Bill not found"
            );

        }

        const upiId =
        "adalattishree1094-2@okaxis";

        const upiUrl =
        `upi://pay?pa=${upiId}&pn=KSRP Water Bill&am=${bill.amount}&cu=INR`;

        const qrImage =
        await QRCode.toDataURL(
            upiUrl
        );

        res.render(
            "paybill",
            {
                bill,
                qrImage
            }
        );

    } catch (err) {

        console.log(err);

        res.status(500).send(
            "Error generating payment page"
        );

    }

});

//Reports
app.get("/reports", isAdmin, (req,res)=>{
    res.render("reports");
});

//Profile
app.get("/user_profile", (req, res, next) => {
    if (!req.session.user) {
        return res.redirect("/Userlogin");
    }
    next();
}, async (req, res) => {
    if (!req.session.user) {
        return res.redirect("/Userlogin");
    }

    const user = await User.findById(req.session.user._id);
    res.render("user_profile", { user });
});

//logout
app.get("/admin/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/Admin");
});

app.get("/admin/total-users", isAdmin, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        res.json({ totalUsers });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin Settings Page
app.get("/admin_settings", isAdmin, async (req, res) => {

    const admin = await Admin.findOne({});

    res.render("admin_settings", {
        admin,
        updated: req.query.updated
    });

});
// Update Admin Details
app.post("/admin/update-settings", isAdmin, async (req, res) => {

    try {

        const admin = await Admin.findOne({});

        const updateData = {
            adminId: req.body.adminId,
            email: req.body.email
        };

        // Change password only if a new password is entered
        if (req.body.newPassword) {

            // Verify current password
            const valid = await bcrypt.compare(
                req.body.currentPassword,
                admin.password
            );

            if (!valid) {
                return res.render("admin_settings", {
                    admin,
                    errorMessage: "Current password is incorrect!"
                });
            }

            // Check confirm password
            if (req.body.newPassword !== req.body.confirmPassword) {
                return res.render("admin_settings", {
                    admin,
                    errorMessage: "Passwords do not match!"
                });
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(
                req.body.newPassword,
                10
            );

            updateData.password = hashedPassword;
        }

        await Admin.findByIdAndUpdate(
            admin._id,
            updateData
        );

        res.render("admin_settings", {
            admin: await Admin.findOne({}),
            successMessage: "Settings Updated Successfully!"
        });

    } catch (err) {

        console.log(err);
        res.send("Error updating settings");

    }
});

//password reset option
app.put("/admin/users/reset-password/:id", isAdmin, async (req,res) => {

  try {

    const hashedPassword =
      await bcrypt.hash(req.body.password,10);

    await User.findByIdAndUpdate(
      req.params.id,
      {
        password: hashedPassword
      }
    );

    res.send("Password reset successfully");

  } catch(err) {
    console.log(err);
    res.status(500).send("Error");
  }

});

//Payment Submitted 
app.get(
"/payment-submitted/:id",
async (req,res)=>{

    try{

        await Bill.findByIdAndUpdate(

            req.params.id,

            {
                status:
                "Payment Verification Pending"
            }

        );

        res.render(
            "payment_submitted"
        );

    }
    catch(err){

        console.log(err);

        res.send(
            "Error"
        );

    }

});

//Payment Aprovement by the Admin
app.post(
"/admin/approve-payment/:id",
isAdmin,
async (req,res)=>{

    await Bill.findByIdAndUpdate(

        req.params.id,

        {
            status:"Paid"
        }

    );

    res.render("paymentapproved");

});

//pending approvels by admin
app.get(
"/admin/pending-payments",
isAdmin,
async (req,res)=>{

    const bills =
    await Bill.find({

        status:
        "Payment Verification Pending"

    });

    res.render(
        "pendingPayments",
        {
            bills
        }
    );

});
//pending Aprove BUTTON
app.post(
"/admin/approve-payment/:id",
isAdmin,
async (req,res)=>{

    await Bill.findByIdAndUpdate(

        req.params.id,

        {
            status:"Paid"
        }

    );

    res.redirect(
        "/admin/pending-payments"
    );

});

//Reject Button
app.post(
"/admin/reject-payment/:id",
isAdmin,
async (req,res)=>{

    await Bill.findByIdAndUpdate(

        req.params.id,

        {
            status:"Unpaid"
        }

    );

    res.redirect(
        "/admin/pending-payments"
    );

});




//Preview the Upload of Exel Sheet of the Data
app.post(
"/admin/upload-preview",
isAdmin,
upload.single("excelFile"),
async(req,res)=>{

try{

    const workbook =
    XLSX.readFile(
        req.file.path
    );

    const sheet =
    workbook.Sheets[
        workbook.SheetNames[0]
    ];

    const data =
    XLSX.utils.sheet_to_json(
        sheet
    );
    console.log(data);

let duplicates = [];
let validRecords = [];

const seenRecords = new Set();

for(const row of data){

   const email =
String(row.Email || "")
.trim()
.toLowerCase();

const uniqueKey =
`${email}-${row.Month}-${row.Year}`;
    // Duplicate inside uploaded Excel

    if(seenRecords.has(uniqueKey)){

        duplicates.push(row);
        continue;

    }

    seenRecords.add(uniqueKey);

    // Duplicate already in MongoDB

    const existingBill =
    await Bill.findOne({

        email: row.Email,
        month: row.Month,
        year: row.Year

    });

    if(existingBill){

        duplicates.push(row);

    }
    else{

        validRecords.push(row);

    }
}

res.json({

    totalRecords:data.length,
    validRecords:validRecords.length,
    duplicateRecords:duplicates.length,
    preview:validRecords,
    duplicates

});
}
catch(err){

    console.log(err);

    res.status(500).json({
        message:"Preview Failed"
    });

}

});

//ConfirmUpload of Sheet
app.post(
"/admin/confirm-upload",
isAdmin,
async(req,res)=>{

try{

    const records =
    req.body.records;

    const billsToInsert = [];

    for(const row of records){

        billsToInsert.push({

            billId:
            "WB" +
            Date.now() +
            Math.floor(Math.random()*1000),

            name:row.Name,
            email:row.Email,
            block:row.Block,
            room:row.Room,
            previousReading:row.previousReading,
            currentReading:row.currentReading,
            amount:row.Amount,
            month:row.Month,
            year:row.Year,
            status:
            row.Status || "Unpaid"

        });

    }

    await Bill.insertMany(
        billsToInsert
    );
    await UploadHistory.create({

    fileName:
    req.body.fileName,

    month:
    req.body.month,

    year:
    req.body.year,

    totalRecords:
    req.body.totalRecords,

    validRecords:
    billsToInsert.length,

    duplicateRecords:
    req.body.duplicateRecords,

    uploadedBy:
    "Administrator"

});

    res.json({
        success:true
    });

}
catch(err){

    console.log(err);

    res.status(500).json({
        success:false
    });

}

});

app.get(
"/admin/upload-history",
isAdmin,
async (req,res)=>{

    try{

        const history =
        await UploadHistory.find()
        .sort({ uploadedAt:-1 });

        res.json(history);

    }
    catch(err){

        console.log(err);

        res.status(500).json([]);

    }

});


//Mybillprintfor user
app.get("/mybill", async (req, res) => {

    if (!req.session.user) {
        return res.redirect("/Userlogin");
    }

    const bill = await Bill.findOne({
        email: req.session.user.email
    }).sort({ _id: -1 });

    if (!bill) {
        return res.send("No bill found");
    }

    res.render("mybill", { bill });

});

//API Route for the REPORT Generation
app.get("/admin/report-data", isAdmin, async (req,res)=>{

    try{

        const { month, year } = req.query;

        const bills = await Bill.find({
            month,
            year:Number(year)
        });

        res.json(bills);

    }
    catch(err){

        console.log(err);

        res.status(500).json({
            message:"Error fetching report"
        });

    }

});


app.listen(3000, () => {
    console.log("Server Is Running on port 3000");
});