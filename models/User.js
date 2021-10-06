const mongoose = require('mongoose');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const config = require("config");

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    creaedAt: {
        type: Date,
        default: Date.now
    },
    resetPasswordToken: {
        type: String,
        default: null,
        required: false,
    },
})

UserSchema.pre("save", async function (next) {
    const user = this;
    // if (user.isModified("password")) {
    //   user.password = await bcrypt.hash(user.password, 8);
    // }
    if (!user.valid) {
        user.validationToken = crypto.randomBytes(64).toString("hex");
    }
    next();
});

UserSchema.methods.generateAuthToken = async function () {
    const { _id } = this;
    // process.env.JWT_KEY -> Bearer should be replaced by this
    return jwt.sign({ user: { id: _id } }, config.get("JwtSecret"),);
};
UserSchema.methods.createResetPasswordToken = async function () {
    this.resetPasswordToken = crypto.randomBytes(64).toString("hex");
    this.save();
    return this.resetPasswordToken;
};
// userSchema.statics.findByCredentials = async (email, password) => {
//     const user = await User.findOne({ email }).select("+password");
//     if (!user) {
//       return false;
//     }
//     const isPasswordMatch = await bcrypt.compare(password, user.password);
//     if (!isPasswordMatch) {
//       return false;
//     }
//     return user;
//   };
// const User = mongoose.model("user", UserSchema);

// module.exports = User;
module.exports = User = mongoose.model('user', UserSchema);