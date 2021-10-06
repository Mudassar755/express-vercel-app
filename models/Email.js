const mongoose = require('mongoose');

const EmailSchema = mongoose.Schema({
  
    name: {
        type: String
    },

    email: {
        type: String
    },

    subject: {
        type: String
    },

    messgae: {
        type: String
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = Email = mongoose.model('email', EmailSchema);