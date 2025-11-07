import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../../prismaClient.js'

const router = express.Router()

router.post('/login', async(req,res) => {
    const {username, password} = req.body

    try {
        const user = await prisma.user.findUnique({
            where: {
                username: username
            }
        })

        // if not a user 
        if (!user){
            return res.status(404).send({message: "User not found."})
        }

        const passwordIsValid = bcrypt.compareSync(password, user.password)
        if (!passwordIsValid){
            return res.status(401).send({message: "Invalid password!"})
        }
        console.log(user)

        //successful authentication
        const token = jwt.sign({id: user.id}, process.env.JWT_SECRET, {expiresIn: '24h'})
        res.json({message: "Login successfully!", token, 
            user: {
                id: user.id,
                fullname: user.fullname, 
                role: user.role
            }
        })
    } catch(err){
        console.log(err.message)
        res.status(503).send({message: "Server Error"})
    }
})

export default router