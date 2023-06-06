const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
require("dotenv").config();
const session = require("express-session");
const PORT = process.env.PORT || 8000;
const path = require("path");
const ejs = require("ejs");
const mongoose=require("mongoose");
const userSchema=require("../Session_managment-main/modules/user");
const bcrypt=require("bcrypt");
app.use(express.urlencoded({extended:false}))
app.use(express.json());

/**
 * Middleware
 */
app.use(express.json());
app.set("view engine", "ejs");
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: false }));
app.use(
  session({
    secret: "!@*#$(&!#my_secret_()*$!@01293",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 },
  })
);

app.get("/", (req, res) => {
  res.render("home");
});

/**
 * Login
 */
app.get("/login", (req, res) => {
  res.render("login");
});
app.post("/login",async (req, res) => {
  const { username, password } = req.body;
  try {
    
    const existuser=await userSchema.findOne({username:username});
    if(!existuser){
      res.status(400).json({error:"user not found"})
    }
    const matchpassword=await bcrypt.compare(password,existuser.password);
    if(!matchpassword){
      res.status(400).json({error:"invalid password"})
    }
    req.session.isAuth = true;
    res.redirect(`/dashboard/${existuser._id}`);
  } catch (error) {
    console.log(error);
  }
});

/**
 * Register
 */
app.get("/register", (req, res) => {
  res.render("register");
});
app.post("/register",async (req, res) => {
  let data=req.body;
  console.log(data);
  const userExist=await userSchema.findOne({username:data.username});
  try {
    if(userExist){
      res.status(200).json({error:"user found"})
    }else{
      const hashpassword=await bcrypt.hash(data.password,10);
      const result=await userSchema.create({
        username:data.username,
        password:hashpassword
      })
      console.log(result);
      req.session.isAuth = true;
    res.redirect(`/dashboard/${result._id}`);
    }
  } catch (error) {
     console.log(error);
  }
  
});

/**
 * Dashboard
 */

function isAuth(req, res, next) {
  if (req.session.isAuth) {
    next();
  } else res.redirect("/login");
}

app.get("/dashboard/:id", isAuth, async(req, res) => {
  let data=await userSchema.findOne({_id:req.params.id})
  res.render("dashboard",{
    data:data.username
  });
});

/**
 * Logout
 */

app.get("/logout", (req, res) => {
  req.session.isAuth = false;
  res.redirect("/login");
});
mongoose.connect("mongodb+srv://admin:admin@cluster0.o7ecu58.mongodb.net/Session?retryWrites=true&w=majority").then(()=>{
  app.listen(PORT, (err) => {
    if (err) console.log(`Error listening on ${PORT}`);
    else console.log(`Servers started on port  http://localhost:${PORT}`);
  });
  
}).catch((error)=>{
  console.log(error);
})
