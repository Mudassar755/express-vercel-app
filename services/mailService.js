const nodemailer = require("nodemailer");
const Email = require("email-templates");
var directTransport = require('nodemailer-direct-transport');
const dotenv = require("dotenv");
dotenv.config();
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.USER,
    pass: process.env.PASS,
  },
});

exports.sendEmail = async (mailOptions, locals = {}, template = "") => {
  const { to, from } = mailOptions;
  console.log("mail options", mailOptions)
  console.log("locals", locals)
  console.log("template", template)
  if (template) {
    const email = new Email({
      message: {
        from
      },
      // uncomment below to send emails in development/test env:
      send: true,
      transport: transporter,
    });
    return await email.send({
      template: template,
      message: {
        to,
      },
      locals,
    });
  }
 return transporter.sendMail({
      
    from: from,
          
    to: to,
          
    subject: 'Reset Password',
          
    html: 'hello world!'
      
    });
  // return transporter.sendMail(mailOptions);
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
