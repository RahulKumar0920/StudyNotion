const User = require("../models/User");
const OTP = require("../models/Otp");
const otpGenerator = require("otp-generator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
//sendOTP
exports.sendOtp = async (req, res) => {
  try {
    //fetch email from body
    const { email } = req.email;

    //checking if user exsist
    const checkUserPresent = await User.find({ email });

    //if user already exsist, return a response
    if (checkUserPresent) {
      return res.status(401).json({
        success: false,
        message: "User already exsist",
      });
    }
    //if user not exsist, generate otp
    var otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });
    console.log("OTP generated", otp);

    //checking unique otp
    const result = await OTP.findOne({ otp: otp });

    while (result) {
      otp = otpGenerator(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
      });
      result = await OTP.findOne({ otp: otp });
    }

    //entering in db
    const otpPayload = { email, otp };
    // create and entry for OTP
    const otpBody = await OTP.create(otpPayload);
    console.log(otpBody);

    //returning response
    res.status(200).json({
      success: true,
      message: "OTP Sent Successfully",
      otp,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//singUp
exports.signUp = async (req, res) => {
  try {
    //data fetch from body
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      accountType,
      contactNumber,
      otp,
    } = req.body;
    //validating
    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !confirmPassword ||
      !otp
    ) {
      return res.status(403).json({
        success: false,
        message: "All fields are required",
      });
    }
    //mathing both entered password
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password does not match",
      });
    }
    //check user exsistence
    const exsistingUser = await User.findOne({ email });
    if (exsistingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exsist",
      });
    }
    //find most recent otp for user
    const recentOtp = await otp.find({ email }).sort({ createdAt: -1 }).limt(1);
    console.log(recentOtp);
    //validating otp
    if (recentOtp.length == 0) {
      //OTP not found
      return res.status(400).json({
        success: false,
        message: "otp not found",
      });
    } else if (otp != recentOtp) {
      return res.status(400).json({
        success: false,
        message: "Invaild otp",
      });
    }
    //hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    //creating entry in db
    const profileDetails = await Profile.create({
      gender: null,
      dateOfBirth: null,
      about: null,
      contactNumber: null,
    });

    const user = await User.create({
      firstName,
      lastName,
      email,
      contactNumber,
      password: hashedPassword,
      accountType,
      additionalDetails: profileDetails._id,
      image: `https://api.dicebear.com/5.x/initials/svg/seed=${firstName} ${lastName}`,
    });
    //return response
    return res.satuts(200).json({
      success: true,
      message: "User registered successfully",
      user,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "User cannot be registered. Please try again",
    });
  }
};

//logIn
exports.login = async (req, res) => {
  try {
    //get data from request body
    const { email, password } = req.body;
    //validate data
    if (!email || !password) {
      return res.status(403).json({
        success: false,
        message: "All fields are required",
      });
    }
    //check user exsistence
    const user = await User.findOne({ email }).populate("additionalDeatils");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not registred",
      });
    }
    //generate JWT, after matching password
    if (await bcrypt.compare(password, user.password)) {
      const payload = {
        email: user.email,
        id: user._id,
        role: user.role,
      };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "2h",
      });
      user.token = token;
      user.password = undefined;

      //create cookie and send response
      const options = {
        expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        httpOnly: true,
      };
      res.cookie("token", token, options).status(200).json({
        success: true,
        token,
        user,
        message: "Logged in successfully",
      });
    } else {
      return res.status(401).json({
        success: false,
        message: "Password is incorrect",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Login failure,Please try again",
    });
  }
};

//changePassword
exports.changePassword = async (req, res) => {
  //get data from req body
  //get oldPassword,newPassword,confirmPassword
  //validation
  //
  //update password in DB
  //send mail - Password update
  //return response
};
