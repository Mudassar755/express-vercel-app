const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
const mailService = require("../services/mailService");
const { check, validationResult } = require("express-validator");
const crypto = require("crypto");

const auth = require("../middleware/auth");
const User = require("../models/User");

const router = express.Router();

//@route   POST api/auth
//@desc    Get User
//@access  Private

router.post("/", auth, async (req, res) => {
  // req.session.destroy();
  // console.log(req.session)
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

//@route   POST api/auth/validate
//@desc    Validate User
//@access  Public

router.post("/validate", async (req, res) => {
  const { token: validationToken, id } = req.body;
  try {
    const user = await User.findOneAndUpdate(
      {
        _id: id,
        validationToken,
      },
      {
        valid: true,
        validationToken: null
      }
    );

    if (!user) {
      return res
        .status(400)
        .json({ errors: [{ msg: "User Token is incorrect or expired!" }] });
    }
    // if (!user) {
    //   return res.json({msg: "User Token is incorrect or expired!" })
    // }
    const token = await user.generateAuthToken();
    await mailService.sendEmail(
      {
        to: user.email,
        from: config.get('USER'),
        subject: "Successfully Registered",
      },
      {
        id: user._id,
        name: user.name
      },
      "welcome"
    );
    res.send({
      user,
      token,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }


})

//@route   POST api/auth/resendValidateEmail
//@desc    Resend Validate Email User
//@access  Private

router.post("/resendValidateEmail", auth, async (req, res) => {
  const { currentUser } = req;
  try {
    let user = await User.findOne({ email: currentUser.email })
    if (user) {
      await mailService.sendEmail(
        {
          to: currentUser.email,
          from: config.get('USER'),
          subject: "Confirm Email",
        },
        {
          validationToken: currentUser.validationToken,
          id: currentUser._id,
          name: currentUser.name
        },
        "validate"
      );
    }
    res.send({ success: true })
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
})

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

      // if (user.validationToken === undefined) {
      //   await User.findOneAndUpdate(
      //     {
      //       _id: user._id,
      //     },
      //     {
      //       validationToken: crypto.randomBytes(64).toString("hex"),
      //     }
      //   );

      //   await user.save();

      //   await mailService.sendEmail(
      //     {
      //       to: email,
      //       from: config.get('USER'),
      //       subject: "Confirm Email",
      //     },
      //     {
      //       validationToken: user.validationToken,
      //       id: user._id,
      //       name: user.name
      //     },
      //     "validate"
      //   );

      //   const token = await user.generateAuthToken();
      //   return res
      //     .status(400)
      //     .json({ errors: [{ msg: "Confirm your email address to proceed!" }] });
      // }

      // if (!user.valid) {
      //   return res
      //     .status(400)
      //     .json({ errors: [{ msg: "User is not activated, verify your email, or click on the link to ", link: "/validate" }] });
      // }

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
          from: config.get('USER'),
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
        config.get("JwtSecret"),
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

//@route   DELETE api/profile
//@desc    Delete  user
//@access  Private

router.delete("/", auth, async (req, res) => {
  try {

    //Remove user
    await User.findOneAndRemove({ _id: req.user.id });

    res.json({ msg: "User deleted" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
