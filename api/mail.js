const express = require("express");
const { check, validationResult } = require("express-validator");
const mailService = require("../services/mailService");
const Email = require("../models/Email")
const config = require('config');
const auth = require("../middleware/auth");
const Permission = require("../middleware/permission")
const dotenv = require("dotenv");
dotenv.config();

const router = express.Router();

//@route   POST api/mail
//@desc    Send Email
//@access  Public
router.post(
    "/",
    [
        check("message", "Please write a message before submit")
            .not()
            .isEmpty(),
        // check("email", "please include a valid email").isEmail(),
    ],
    async (req, res) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, subject, message } = req.body;

        try {
            await mailService.sendEmail(
                {
                    to: process.env.USER,
                    from: process.env.USER,
                    replyTo: email,
                },
                {
                    subject: subject,
                    message: message,
                    html: `<p>You are receiving this message from ${email} </p>
                        <p> Hello! <br> ${message} </p>`
                },
                "feedback"
            );
            const mail = new Email({
                name,
                email,
                subject,
                message
            });
            await mail.save();

            res.send({ success: true });

        } catch (err) {
            console.error(err.message);
            res.status(500).send("Server Error");
        }
    }
);

//@route   POST api/mail
//@desc    Update Email
//@access  Private
router.post(
    "/update",
    auth, Permission,
    async (req, res) => {
        const errors = validationResult(req);
     
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, subject, message } = req.body;

        const emailFields = {};
        if (name) emailFields.name = name;
        if (email) emailFields.email = email;
        if (subject) emailFields.subject = subject;
        if (message) emailFields.message = message;

        try {
            let mail = await Email.findOne({ _id: req.body.id });

            if (mail) {

                // await mail.save();
                mail = await Email.findOneAndUpdate(
                    { _id: req.body.id },
                    { $set: emailFields },
                    { new: true }
                );

                return res.json(mail);
            }

        } catch (err) {
            console.error(err.message);
            res.status(500).send("Server Error");
        }
    }
);

//@route   DELETE api/mail
//@desc    Delete Email
//@access  Private

router.delete("/", auth, Permission, async (req, res) => {
    try {

        //Remove email
        await Email.findOneAndRemove({ _id: req.body.id });

        res.json({ msg: "Email deleted" });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

//@route  POST api/mail
//@desc    Get all EMmails
//@access  Private

router.get('/', auth, Permission, async (req, res) => {
    try {
        const mails = await Email.find();
        res.json(mails);

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }

})
module.exports = router;
