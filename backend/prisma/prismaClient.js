import { PrismaClient } from "@prisma/client"
import { nbrOfResidentExtension } from "../src/middleware/residentMiddleware.js"

const basePrisma = new PrismaClient()
const prisma = basePrisma.$extends(nbrOfResidentExtension(basePrisma))

export default prisma
