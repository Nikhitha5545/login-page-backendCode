const express = require("express");
const app = express();
const mongoose = require("mongoose");
app.use(express.json());
const cors = require("cors");
app.use(cors());
const bcrypt =require("bcryptjs");
app.set("view engine","ejs");
app.use(express.urlencoded({extended:false}));

const jwt=require("jsonwebtoken");
var nodemailer = require('nodemailer');
const JWT_SECRET="njkhsuayd89qwk[pw14072856732gje2746126541jkmkefrnuifggq2.,MLJR9I0EOOEFFUIY2784623789RHUhrok3jt";
 
const mongoUrl="mongodb+srv://nikhitha:nikhitha@cluster0.3pcnpbk.mongodb.net/?retryWrites=true&w=majority";
mongoose.connect(mongoUrl,{
    useNewUrlParser:true
}).then(()=>{
    console.log("Database Connected");
})
.catch((e)=>console.log(e))

require("./userDetails")
const User=mongoose.model("UserInfo")
app.post("/register", async(req,res) => {
    const {fname,lname, email, password, userType} = req.body
    const encryptedPassword=await bcrypt.hash(password, 10);
    try {
        const oldUser =await User.findOne({email});
        if(oldUser){
        return    res.json({error:"User Exits"});
        }
        
        await User.create({
            fname,
            lname,
            email,                       
            password:encryptedPassword,
            userType,
        });
        res.send({status:"ok"})

    } catch (error) {   
      res.send({status:"error"}) ;
    }
});
app.post("/login-user",async(req,res)=>{
    const {email,password}=req.body;
    const user =await User.findOne({email});
    if(!User){
    return res.json({error:"User Not Found"});
    }
    if(await bcrypt.compare(password, user.password)){
        const token = jwt.sign({email:user.email},JWT_SECRET,{
            expiresIn:"15m",
        });
        if(res.status(201)){
            return res.json({status:"ok", data:token});
        }
        else{
            return res.json({error:"error"}); 
        }
    }
    res.json({status:"error", error:"invalid password"});
});
app.post("/userData",async(req,res)=>{
const {token} =req.body;
try {
    const user = jwt.verify(token,JWT_SECRET,(err,res)=>{
        if(err){
            return "token expired";
        }
        return res;
 });
    console.log(user);
    if(user == "token expired"){
        return res.send({status:"error",data:"token expired"});
    }  
    const userEmail = user.email;
    User.findOne({email:userEmail})
    .then((data)=>{
        res.send({status:"ok",data:data});
    })
   .catch((error)=>{
    res.send({status:"error",data:error});
   });
} catch (error) {
    
}
});

app.listen(5050,()=>{
    console.log("server started" );
});

app.post("/forgot-password",async(req,res)=>{
    const {email} = req.body;
    try {
        const oldUser = await User.findOne({email});
        if(!oldUser){
           return res.json({status:"User not existed"});
        }
        const secret = JWT_SECRET + oldUser.password;
            const token = jwt.sign({ email: oldUser.email, id: oldUser._id },secret,{
                expiresIn:"5m",
            });
            const link = `http://localhost:5050/reset-password/${oldUser._id}/${token}`;
            var transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                  user: 'nikhitha838@gmail.com',
                  pass: 'aambyqzgoovkxjyo'
                }
              });
              
              var mailOptions = {
                from: 'youremail@gmail.com',
                to: 'nikithalakshman@gmail.com',
                subject: 'Password Reset',
                text: link
              };
              
              transporter.sendMail(mailOptions, function(error, info){
                if (error) {
                  console.log(error);
                } else {
                  console.log('Email sent: ' + info.response);
                }
              });
            console.log(link);
    } catch (error) { }
});

app.get("/reset-password/:id/:token", async (req,res) => {
    const { id, token } = req.params;
    console.log(req.params);
    const oldUser = await User.findOne({_id: id});
    if(!oldUser){
        return res.send({status:"User not exist"});
    }
    const secret = JWT_SECRET + oldUser.password;
    try {
        const verify = jwt.verify(token,secret);
        res.render("index", { email: verify.email,status:"Not Verified"});
    } catch (error) {
        res.send("Not verified");
    }
});

app.post("/reset-password/:id/:token", async (req,res) => {
    const { id, token } = req.params;
    const { password } = req.body;
    const oldUser = await User.findOne({_id: id});
    if(!oldUser){
        return res.json({status:"User not exist"});
    }
    const secret = JWT_SECRET + oldUser.password;
    try {
        const verify = jwt.verify(token, secret);
        const encryptedPassword = await bcrypt.hash(password, 10);
        await User.updateOne(
            {
                _id:id,
            },
            {
                $set:{ password:encryptedPassword, },
            }
        );
        //res.json({status:"Password Updated"});

        res.render("index", { email: verify.email, status:"verified"});
    } catch (error) {
        console.log(error);
        res.json({status:"Something Went Wrong"});
    }
}); 
app.get("/getAllUser",async(req,res)=>{
    try {
       const allUser = await User.find({});
       res.send({status:"ok",data:allUser}) ; 
    } catch (error) {
       console.log(error); 
    }
});
app.post("/deleteUser",async(req,res)=>{
    const { userid } = req.body;
    try {
      await  User.deleteOne({_id:userid});
     res.send({status:"ok",data:"deleted"});
        
    }catch (err) {
        console.log(err);
        res.status(500).send({status: "error", data: "an error occured while deleting user"});
    }
});
