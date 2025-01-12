const User = require("../models/User");

module.exports = async (req, res, next) => {
  try {
    if (!req.userId)
      return res.status(401).json({ error: "Not authenticated" });
    const user = await User.findById(req.userId).select("role");
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.role !== "admin")
      return res.status(403).json({ error: "Admin only" });
    next();
  } catch (err) {
    next(err);
  }
};