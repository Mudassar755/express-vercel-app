const jwt = require('jsonwebtoken');
const User = require('../models/User');
const dotenv = require("dotenv");
dotenv.config();

module.exports = async function (req, res, next) {
    //Get Token from header
    const token = req.header('x-auth-token');
    
    //Check if tken
    if (!token) {
        res.status(200).json({ msg: 'No token, Autherization denied' })
        return
    }

    //Verify token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET );
        req.user = decoded.user;
        req.currentUser = await User.findById(decoded.user.id)
        next();
    } catch (err) {
        res.status(200).json({ msg: 'Token is not valid' })
    }
}