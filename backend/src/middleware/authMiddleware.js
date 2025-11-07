import jwt from "jsonwebtoken"

function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers["authorization"]
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader

    if (!token) return res.status(401).json({ message: "No token provided" })

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = { id: decoded.id, role: decoded.role }
    next()
  } catch (err) {
    console.error("JWT verification failed:", err.message)
    return res.status(401).json({ message: "Invalid or expired token" })
  }
}

export default authMiddleware
