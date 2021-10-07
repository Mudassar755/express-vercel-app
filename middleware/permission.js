

module.exports = async function(req, res, next) {
console.log("reqqq", req.currentUser)
  if(req.currentUser.role !=="admin") return res.send("No Access! Authorization denied ")
  next()
};
