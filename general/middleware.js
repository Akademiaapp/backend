import express from "express";
var router = express.Router();
import jwt from "jsonwebtoken";

// Middleware to verify JWT
const verifyToken = async (req, res, next) => {
  // Get the bearer token
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ message: "Unauthorized - Token not provided" });
  }

  try {
    // Load the public key dynamically
    const publicKey =
      "-----BEGIN RSA PUBLIC KEY-----" +
      "\n" +
      process.env.AUTH_PUBLIC_KEY +
      "\n" +
      "-----END RSA PUBLIC KEY-----";

    // Verify the token
    const decoded = jwt.verify(token, publicKey, { algorithms: ["RS256"] });

    // Attach user information to the request for further processing
    req.user = decoded;

    next(); // Move to the next middleware or route handler
  } catch (error) {
    console.error("Token verification failed:", error.message);
    return res
      .status(401)
      .json({ message: "Unauthorized - Token verification failed" });
  }
};

export default { verifyToken };