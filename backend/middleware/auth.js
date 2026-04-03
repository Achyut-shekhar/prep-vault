const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  try {
    // Get token from header or query string
    const authHeader = req.header("Authorization");
    let token = null;

    if (authHeader) {
      token = authHeader.replace("Bearer ", "");
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res
        .status(401)
        .json({ message: "No token, authorization denied" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Token is not valid" });
  }
};

module.exports = auth;
