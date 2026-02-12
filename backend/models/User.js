const mongoose =require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name:{
      type:String,
      required:true,
      trim:true,},
    email:{
      type:String,
      required:true,
      trim:true,
      unique:true,
      lowercase:true,
    },
    password:{
      type:String,
      required:true,
      minlength:6,
    },
  },
  {
    timestamps:true, //create and update timestamps automatically added to the document
  }
);

module.exports = mongoose.model("User",userSchema);