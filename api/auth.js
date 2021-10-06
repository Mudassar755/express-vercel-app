const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mailService = require("../services/mailService");
const { check, validationResult } = require("express-validator");
const crypto = require("crypto");
const dotenv = require("dotenv");
dotenv.config();
const auth = require("../middleware/auth");
const User = require("../models/User");

const router = express.Router();


//@route   POST api/auth/login
//@desc    Authentication user & get Token
//@access  Public

router.post("/login",
  [
    check("email", "please include a valid email ").isEmail(),
    check("password", "password is required").exists()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;

    try {
      let user = await User.findOne({ email });

      if (!user) {
        return res
          .status(400)
          .json({ errors: [{ msg: "User does not exist" }] });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Email or Password is incorrect" }] });
      }

      const payload = {
        user: {
          id: user.id
        }
      };
      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '24h' },
        (err, token) => {
          if (err) throw err;
          res.json({ token, user });
        }
      );

    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

//@route   POST api/auth/resetPassword
//@desc    Reset Password
//@access  Public

router.post("/resetPassword", async (req, res) => {
  const { email } = req.body;
  try {
    let user = await User.findOne({ email });

    if (!user) {
      return res
        .status(400)
        .json({ errors: [{ msg: "User does not exist" }] });
    }
    if (user) {
      const resetToken = await user.createResetPasswordToken();
      await mailService.sendEmail(
        {
          to: email,
          from: process.env.USER,
          subject: "Reset Password",
        },
        {
          resetToken,
          id: user._id,
          name: user.name
        },
        "resetPassword"
      );
      res.send({
        success: true,
      });
    }

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

//@route   POST api/auth/validResetPassword
//@desc    Validate Reset Password
//@access  Public

router.post("/validResetPassword", async (req, res, next) => {
  const { token: resetPasswordToken, id } = req.body;
  try {
    const user = await User.findOneAndUpdate(
      {
        _id: id,
        resetPasswordToken,
      },
      {
        resetPasswordToken: null
      }
    );
    if (!user) {
      return res
        .status(400)
        .json({ errors: [{ msg: "User Token is incorrect or expired!" }] });
    }
    // console.log("userrr", user)
    // const user = await User.findOne({
    //   _id: id,
    //   resetPasswordToken: token,
    // });
    if (user) {
      const token = await user.generateAuthToken();
      res.send({
        token: token,
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

//@route   POST api/auth/checkPassword
//@desc    Check Current/old Password
//@access  Private

router.post("/checkPassword", auth, async (req, res) => {
  const { currentUser: { email }, body: { password } } = req;
  try {
    let user = await User.findOne({ email });

    if (!user) {
      return res
        .status(400)
        .json({ errors: [{ msg: "User does not exist" }] });
    }
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res
        // .status(400)
        // .json({ errors: [{ msg: "Password is incorrect" }] });
        .send({
          success: false,
        })

    }
    return res.send({
      success: true,
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

//@route   POST api/auth/updatePassword
//@desc    Update Password
//@access  Private

router.post("/updatePassword", auth, [
  check("password", "password must be 6 characters or more").isLength({
    min: 6
  })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { currentUser } = req;
  const { password } = req.body;

  // const userFields = {};
  //   if (password) userFields.password = password;
  try {
    let user = await User.findOne({ _id: req.user.id });

    if (user) {

      const salt = await bcrypt.genSalt(10);

      currentUser.password = await bcrypt.hash(password, salt);

      // await user.save();
      user = await User.findOneAndUpdate(
        { _id: req.user.id },
        { $set: currentUser },
        { new: true }
      );

      const payload = {
        user: {
          id: req.user.id
        }
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        // { expiresIn: '24h' },
        (err, token) => {
          if (err) throw err;
          res.send({ success: true });
          // res.json({ token });
        }
      );

      // return res.json(user);
    }

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});
module.exports = router;
