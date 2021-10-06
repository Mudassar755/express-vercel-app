const nodemailer = require("nodemailer");
const Email = require("email-templates");
const dotenv = require("dotenv");
const config = require("config")
dotenv.config();
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: config.get("USER"),
    pass: config.get("PASS"),
  },
});

exports.sendEmail = async (mailOptions, locals = {}, template = "") => {
  const { to, from, replyTo } = mailOptions;
  if (template) {
    const email = new Email({
      message: {
        from,
        replyTo
      },
      // uncomment below to send emails in development/test env:
      send: true,
      transport: transporter,
    });
    return await email.send({
      template,
      message: {
        to,
      },
      locals,
    });
  }
  return transporter.sendMail(mailOptions);
}

  // exports.sendRealEmail = CatchAsync.CatchAsync(
  //   async (mailOptions, locals = {}, template = "") => {
  //     const { to, from, origin } = mailOptions;
  //     let email = {
  //       to: mailOptions.to,
  //       subject: mailOptions.subject,
  //       html: template,
  //     }
  //     let response = await transporter.sendMail(email);
  //     return response;
  //   },
  //   500
  // );