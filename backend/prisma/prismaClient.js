import { PrismaClient } from "@prisma/client"
import { nbrOfResidentExtension } from "../src/middleware/residentMiddleware.js"

const prisma = new PrismaClient().$extends(nbrOfResidentExtension)

export default prisma
