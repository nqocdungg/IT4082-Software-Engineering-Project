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
      include: { feeType: {
        select: {
          id: true,
          name: true, 
          shortDescription: true,
          longDescription: true, 
          isMandatory: true, 
          unitPrice: true
        }
      } },
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
        feeType: {
          select: {
            id: true,
            name: true,
            shortDescription: true,
            longDescription: true,
            isMandatory: true
          }
        }
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

export const processPayment = async (req, res) => {
  const paymentMethod = "ONLINE";
  try {
    const userId = req.user.id;
    const { type, feeRecordIds, donations } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { householdId: true }
    });

    if (!user || !user.householdId) {
      return res.status(400).json({ message: "Household information not found." });
    }

    if (type === 'MANDATORY') {
      if (!feeRecordIds || !Array.isArray(feeRecordIds) || feeRecordIds.length === 0) {
        return res.status(400).json({ message: "Invalid fee record list." });
      }

      const updateResult = await prisma.feeRecord.updateMany({
        where: {
          id: { in: feeRecordIds },
          householdId: user.householdId, 
          status: { in: [0, 1] }
        },
        data: {
          status: 2,
          method: paymentMethod,
          updatedAt: new Date()
        }
      });

      return res.json({ 
        message: "Service fee payment completed successfully.",
        updatedCount: updateResult.count 
      });
    }

    else if (type === 'CONTRIBUTION') {
      if (!donations || !Array.isArray(donations) || donations.length === 0) {
        return res.status(400).json({ message: "Invalid donation list." });
      }

      await prisma.$transaction(
        donations.map(donation => {
          return prisma.feeRecord.create({
            data: {
              amount: parseFloat(donation.amount),
              status: 2,
              method: "ONLINE",
              householdId: user.householdId,
              feeTypeId: donation.feeTypeId,
              description: "Đóng góp tự nguyện qua ứng dụng cư dân",
              managerId: userId
            }
          });
        })
      );

      return res.json({
        message: "Donation submitted successfully. Thank you for your generosity!"
      });
    }

    else {
      return res.status(400).json({ message: "Invalid payment type." });
    }

  } catch (error) {
    console.error("Error in processPayment:", error);
    res.status(500).json({ message: "Server error while processing payment." });
  }
};
