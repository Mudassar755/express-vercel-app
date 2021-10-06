const express = require("express");

const router = express.Router();

//@route   POST api/users
//@desc    Register user
//@access  Public
router.get("/", async (req, res) => {
    try {
        res.json({status:200, message:"Get data successfully"})
    } catch (error) {
        
    }
  }
// router.post("/", async (req, res) => {
    
//   }
);

module.exports = router;
