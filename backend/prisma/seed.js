import { PrismaClient } from '@prisma/client'
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
    const hashedHead = await bcrypt.hash('totruong@123', 8)
    const hashedDeputy = await bcrypt.hash('topho@123', 8)
    await prisma.user.createMany({
        data: [
        {
            username: 'to_truong',
            password: hashedHead, 
            fullname: 'Nguyễn Văn A',
            phone: '0912345678',
            role: 'HEAD',
        },
        {
            username: 'to_pho',
            password: hashedDeputy,
            fullname: 'Nguyễn Thị B',
            phone: '0987654321',
            role: 'DEPUTY',
        },
        ],
    })

    console.log('Created successfully')
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  })
