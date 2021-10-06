const express = require("express");
const { check, validationResult } = require("express-validator");
const User = require("../models/User");
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
const auth = require("../middleware/auth");
const mailService = require("../services/mailService");


const router = express.Router();

//@route   POST api/users
//@desc    Register user
//@access  Public
router.post(
  "/",
  [
    check("name", "name is required")
      .not()
      .isEmpty(),
    check("email", "please include a valid email").isEmail(),
    check("password", "password must be 6 characters or more").isLength({
      min: 6
    })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    //need to understand
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      let user = await User.findOne({ email });

      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: "User already exist" }] });
      }

      const avatar = gravatar.url(email, {
        s: "200", //size
        r: "pg", //rating
        d: "mm" //default
      });

      user = new User({
        name,
        email,
        avatar,
        password
      });

      const salt = await bcrypt.genSalt(10);

      user.password = await bcrypt.hash(password, salt);

      await user.save();

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
          res.json({ token, user });
        }
      );
      if (user) {
        await mailService.sendEmail(
          {
            to: email,
            from: config.get('USER'),
            subject: "Confirm Email",
          },
          {
            validationToken: user.validationToken,
            id: user._id,
            name: user.name
          },
          "validate"
        );
      }
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

//@route   POST api/users/update
//@desc    Update user
//@access  Private
router.post(
  "/update",
  auth,
  [
    check("name", "name is required")
      .not()
      .isEmpty(),
    check("email", "please include a valid email").isEmail(),
    check("password", "password must be 6 characters or more").isLength({
      min: 6
    })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    //need to understand
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    const avatar = gravatar.url(email, {
      s: "200", //size
      r: "pg", //rating
      d: "mm" //default
    });
    const profileFields = {};
    if (name) profileFields.name = name;
    if (email) profileFields.email = email;
    if (avatar) profileFields.avatar = avatar;
    if (password) profileFields.password = password;

    try {
      let user = await User.findOne({ _id: req.user.id });

      if (user) {

        const salt = await bcrypt.genSalt(10);

        profileFields.password = await bcrypt.hash(password, salt);
        // await user.save();
        user = await User.findOneAndUpdate(
          { _id: req.user.id },
          { $set: profileFields },
          { new: true }
        );

        const payload = {
          user: {
            id: req.user.id
          }
        };

        jwt.sign(
          payload,
          config.get("JwtSecret"),
          { expiresIn: 3600 },
          (err, token) => {
            if (err) throw err;
            res.json({ token });
          }
        );

        // return res.json(user);
      }

    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

//@route   GET api/users
//@desc    Get All users
//@access  Private
router.post("/all", auth, async (req, res) => {
  
  try {
    const users = await User.find();
    // const users = await User.find({valid:{$exists: false}});
    // const users = await User.deleteMany({valid:{$exists: false}});
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
