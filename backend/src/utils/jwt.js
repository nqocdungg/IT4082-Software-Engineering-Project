import jwt from "jsonwebtoken"

export const genAccessToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            role: user.role,
            fullname: user.fullname, 
            email: user.email,
        },
        process.env.JWT_SECRET, 
        {expiresIn: "1d"}
    )
}

export const genRefreshToken = (userId) => {
    return jwt.sign(
        {
            id: userId,
        },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        {
            expiresIn: "2d"
        }
    )
}

export const verifyToken = (token, isRefresh = false) => {
    const secret = isRefresh ? process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
                            : process.env.JWT_SECRET

    try {
        return jwt.verify(token, secret)
    } catch(err) {
        return null
    }
}