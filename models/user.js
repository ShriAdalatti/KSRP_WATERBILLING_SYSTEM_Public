const mongoose=require('mongoose');
const UserSchema= new mongoose.Schema({

    name: { type:String, required:true },
    block: { type:String, required:true },
    room: { type:String, required:true },
    password:String,
    phone: String,
    email: String

});

module.exports = mongoose.model("user",UserSchema);