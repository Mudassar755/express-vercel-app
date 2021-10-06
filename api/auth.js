const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
// const mailService = require("../services/mailService");
const { check, validationResult } = require("express-validator");
// const crypto = require("crypto");

// const auth = require("../middleware/auth");
const User = require("../models/User");

const router = express.Router();

//@route   POST api/users
//@desc    Register user
//@access  Public
router.get("/", async (req, res) => {
    try {
        res.json({status:200, message:"Get data successfully"})
    } catch (error) {
        
    }
  }
// router.post("/", async (req, res) => {
    
//   }
);

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
    var session;
    const { email, password } = req.body;
    session = req.session;
    // session.userid = email;

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
        config.get("JwtSecret"),
        { expiresIn: '24h' },
        (err, token) => {
          if (err) throw err;
          session.authToken = token;
          res.json({ token, user });
        }
      );

      console.log(req.session)

    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

module.exports = router;
