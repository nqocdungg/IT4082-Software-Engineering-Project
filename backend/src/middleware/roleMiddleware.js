export const allowRoles = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthenticated" })
      }

      const userRole = req.user.role

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({ message: "Forbidden: insufficient role" })
      }

      next()
    } catch (err) {
      console.error("Role middleware error:", err)
      return res.status(500).json({ message: "Server error" })
    }
  }
}
