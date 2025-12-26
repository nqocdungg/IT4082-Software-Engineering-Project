import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export const getPendingFees = async (req, res) => {
  try {
    const userId = req.user.id
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { householdId: true }
    })

    if (!user || !user.householdId) {
      return res.status(400).json({ message: "Household information not found." })
    }

    const mandatoryRecords = await prisma.feeRecord.findMany({
      where: {
        householdId: user.householdId,
        status: { in: [0, 1] }, 
        feeType: { isMandatory: true }
      },
      include: { feeType: true },
      orderBy: { createdAt: "desc" }
    })

    const contributionTypesRaw = await prisma.feeType.findMany({
      where: {
        isMandatory: false,
        isActive: true
      },
      include: {
        feeRecords: {
          where: {
            status: 2 
          },
          select: { amount: true } 
        }
      }
    })

    const contributionFees = contributionTypesRaw.map(type => {
      const totalCommunityDonated = type.feeRecords.reduce((sum, record) => sum + record.amount, 0);
      
      const { feeRecords, ...rest } = type;
      
      return {
        ...rest,
        totalCommunityDonated
      };
    });
    
    const totalAmount = mandatoryRecords.reduce((sum, item) => sum + item.amount, 0)

    res.json({
      mandatoryFees: mandatoryRecords,
      contributionFees, 
      totalAmount
    })

  } catch (error) {
    console.error("Error in getPendingFees:", error)
    res.status(500).json({ message: "Server error." })
  }
}

export const getFeeHistory = async (req, res) => {
  try {
    const userId = req.user.id

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { householdId: true }
    })

    if (!user || !user.householdId) {
      return res.status(400).json({ message: "Invalid household information." })
    }

    const history = await prisma.feeRecord.findMany({
      where: {
        householdId: user.householdId,
        status: 2
      },
      include: {
        feeType: true
      },
      orderBy: { updatedAt: "desc" }
    })

    const totalPaid = history.reduce((sum, item) => sum + item.amount, 0)

    const totalMandatory = history
      .filter(f => f.feeType.isMandatory)
      .reduce((sum, item) => sum + item.amount, 0)

    res.json({
      history,
      statistics: {
        totalPaid,
        totalMandatory,
        totalContribution: totalPaid - totalMandatory
      }
    })

  } catch (error) {
    console.error("Error in getFeeHistory:", error)
    res.status(500).json({ message: "Server error while fetching fee history." })
  }
}

