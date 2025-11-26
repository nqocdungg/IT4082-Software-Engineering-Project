import bcrypt from "bcryptjs"
import prisma from "../../prisma/prismaClient.js"

import { genAccessToken, genRefreshToken } from "../utils/jwt.js"

export const login = async(req, res) => {
    const {username, password} = req.body
    try {
        const user = await prisma.user.findUnique({
            where: {username},
        })
        if (!user) {
            return res.status(404).json({message: "User not found"})
        }

        const isValid = bcrypt.compareSync(password,user.password)
        if (!isValid) {
            return res.status(401).json({message: "Invalid password"})
        }
        
        const accessToken = genAccessToken(user)
        const refreshToken = genRefreshToken(user.id)

        return res.json({
            message: "Login successful", 
            accessToken, 
            refreshToken, 
            user: {
                id: user.id,
                fullname: user.fullname, 
                role: user.role,
            },
        })
    } catch(err){
        console.error(err)
        return res.status(503).json({message: "Server Error"})
    }
}