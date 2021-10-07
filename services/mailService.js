const nodemailer = require("nodemailer");
const Email = require("email-templates");
const dotenv = require("dotenv");
dotenv.config();

const transporter = nodemailer.createTransport({
  port: 465,
  host: "smtp.gmail.com",
  auth: {
    user: process.env.USER,
    pass: process.env.PASS,
  },
  secure: true,
});
// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   host: "smtp.gmail.com",
//   port: 465,
//   secure: true,
//   auth: {
//     user: process.env.USER,
//     pass: process.env.PASS,
//   },
// });

exports.sendEmail = async (mailOptions, locals = {}, template = "") => {
  const { to, from } = mailOptions;
  await new Promise((resolve, reject) => {
    // verify connection configuration
    transporter.verify(function (error, success) {
        if (error) {
            console.log(error);
            reject(error);
        } else {
            console.log("Server is ready to take our messages");
            resolve(success);
        }
    });
});
const mailData = {
  from: {
      name: `Mudassar ali`,
      address: from,
  },
  replyTo: to,
  to: to,
  subject: `form message`,
  text: "message is testing",
  html: `message is tsting html`,
};

await new Promise((resolve, reject) => {
  // send mail
  return transporter.sendMail(mailData, (err, info) => {
      if (err) {
          console.error(err);
          reject(err);
      } else {
          console.log(info);
          resolve(info);
      }
  });
});
  // console.log("mail options", mailOptions)
  // console.log("locals", locals)
  // console.log("template", template)
  // if (template) {
  //   const email = new Email({
  //     message: {
  //       from
  //     },
  //     // uncomment below to send emails in development/test env:
  //     send: true,
  //     transport: transporter,
  //   });
  //   return await email.send({
  //     template: template,
  //     message: {
  //       to,
  //     },
  //     locals,
  //   });
  // }
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
