const jwt = require('jsonwebtoken');
const config = require('config');
const User = require('../models/User');

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
        const decoded = jwt.verify(token, config.get('JwtSecret'));
        req.user = decoded.user;
        req.currentUser = await User.findById(decoded.user.id)
        next();
    } catch (err) {
        res.status(200).json({ msg: 'Token is not valid' })
    }
}