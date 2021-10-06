const express = require("express");
const { check, validationResult } = require("express-validator");
const mailService = require("../services/mailService");
const config = require('config');
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

        const { firstName, lastName, email, subject, message } = req.body;

        try {
            // console.log("req,", req.body)
            const { emailTo: to, lead: html } = req.body;
            if (email) {
                await mailService.sendEmail(
                    {
                        to: config.get("USER"),
                        from: config.get("USER"),
                        subject: "Feedback",
                        replyTo: email
                    },
                    {
                        firstName: firstName,
                        email: email,
                        subject: subject,
                        message: message,
                    },
                    "feedback"
                );
            }
            else {
                await mailService.sendEmail(
                    {
                        to: config.get("USER"),
                        from: config.get("USER"),
                        subject: "Faqs",
                    },
                    {
                        message: message,
                    },
                    "faqs"
                );
            }

            res.send({ success: true });

        } catch (err) {
            console.error(err.message);
            res.status(500).send("Server Error");
        }
    }

);

module.exports = router;
