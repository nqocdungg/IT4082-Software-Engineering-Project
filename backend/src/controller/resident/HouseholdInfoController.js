import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// Get general info of the Household (Info + Members)
export const getMyHouseholdInfo = async (req, res) => {
  try {
    const userId = req.user.id 

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { householdId: true }
    })

    if (!user || !user.householdId) {
      console.warn(`[HouseholdInfo] User ${userId} is not linked to any household.`)
      return res.status(404).json({ 
        message: "Account is not linked to any household." 
      })
    }

    const household = await prisma.household.findUnique({
      where: { id: user.householdId },
      include: {
        owner: {
          select: { fullname: true, residentCCCD: true }
        },
        residents: {
          where: {
            status: { in: [0, 1, 2] }
          },
          orderBy: { relationToOwner: 'asc' }
        }
      }
    })

    if (!household) {
      console.error(`[HouseholdInfo] Household ID ${user.householdId} found in User record but not in Household table.`)
      return res.status(404).json({ message: "Household data not found." })
    }

    res.json(household)

  } catch (error) {
    console.error("Error in getMyHouseholdInfo:", error)
    res.status(500).json({ message: "Internal server error while fetching household info." })
  }
}

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

    const fees = await prisma.feeRecord.findMany({
      where: {
        householdId: user.householdId,
        status: { in: [0, 1] }
      },
      include: {
        feeType: true,
        manager: { select: { fullname: true } }
      },
      orderBy: { createdAt: "desc" }
    })

    const mandatoryFees = fees.filter(f => f.feeType.isMandatory === true)
    const contributionFees = fees.filter(f => f.feeType.isMandatory === false)

    const totalAmount = fees.reduce((sum, item) => sum + item.amount, 0)

    res.json({
      mandatoryFees,
      contributionFees,
      totalAmount
    })

  } catch (error) {
    console.error("Error in getPendingFees:", error)
    res.status(500).json({ message: "Server error while fetching pending fees." })
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

export const getMyHouseholdHistory = async (req, res) => {
  try {
    const userId = req.user.id

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { householdId: true }
    })

    if (!user || !user.householdId) {
      return res.status(400).json({ message: "User invalid or household not found." })
    }

    const residents = await prisma.resident.findMany({
      where: { householdId: user.householdId },
      select: { id: true }
    })
    
    const residentIds = residents.map(r => r.id)

    const history = await prisma.residentChange.findMany({
      where: {
        residentId: { in: residentIds }
      },
      include: {
        resident: { select: { fullname: true } },
        manager: { select: { fullname: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json(history)

  } catch (error) {
    console.error("Error in getMyHouseholdHistory:", error)
    res.status(500).json({ message: "Internal server error while fetching history." })
  }
}