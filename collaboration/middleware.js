import jwt from "jsonwebtoken";

// Middleware to verify JWT
const verifyToken = (token) => {
  if (!token) {
    return false;
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
    return decoded;
  } catch (error) {
    console.error("Token verification failed:", error.message);
    return false;
  }
};

export default { verifyToken };