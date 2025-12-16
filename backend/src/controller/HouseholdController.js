import prisma from '../../prisma/prismaClient.js'

/* GET /api/households */
export const getAllHouseholds = async (req, res) => {
  try {
    const households = await prisma.household.findMany({
      include: { owner: true, residents: true }
    })

    return res.status(200).json({
      success: true,
      message: "Fetched households",
      data: households
    })

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

/* GET /api/households/:id */
export const getHouseholdById = async (req, res) => {
  try {
    const household = await prisma.household.findUnique({
      where: { id: Number(req.params.id) },
      include: { owner: true, residents: true, feeRecords: true }
    })

    if (!household)
      return res.status(404).json({ success: false, message: "Not found" })

    return res.status(200).json({
      success: true,
      message: "Fetched household",
      data: household
    })

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

/* POST /api/households */
export const createHousehold = async (req, res) => {
  const { address, ownerCCCD, ownerName, ownerDob, ownerGender } = req.body

  try {
    const result = await prisma.$transaction(async (tx) => {
      const newHousehold = await tx.household.create({
        data: {
          address,
          registrationDate: new Date(),
          nbrOfResident: 1,
          status: 1,
        }
      })

      const newOwner = await tx.resident.create({
        data: {
          residentCCCD: ownerCCCD,
          fullname: ownerName,
          dob: new Date(ownerDob),
          gender: ownerGender,
          relationToOwner: "HEAD",
          status: 1,
          householdId: newHousehold.id
        }
      })

      const updatedHousehold = await tx.household.update({
        where: { id: newHousehold.id },
        data: {
          ownerId: newOwner.id
        },
        include: { owner: true }
      })

      return updatedHousehold
    })

    return res.status(201).json({
      success: true,
      message: "Created household successfully",
      data: result
    })

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Create failed: " + err.message
    })
  }
}

/* POST /api/households/:id/residents */
export const addResidentToHousehold = async (req, res) => {
  const { householdId } = req.params
  const { residentCCCD, fullname, dob, gender, relationToOwner } = req.body

  try {
    const exist = await prisma.resident.findUnique({
      where: { residentCCCD }
    })

    if (exist)
      return res.status(400).json({
        success: false,
        message: "CCCD already exists"
      })

    const newResident = await prisma.resident.create({
      data: {
        residentCCCD,
        fullname,
        dob: new Date(dob),
        gender,
        relationToOwner,
        status: 1,
        householdId: Number(householdId)
      }
    })

    await prisma.household.update({
      where: { id: Number(householdId) },
      data: { nbrOfResident: { increment: 1 } }
    })

    return res.status(201).json({
      success: true,
      message: "Resident added",
      data: newResident
    })

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

/* PUT /api/households/:id/status */
export const changeHouseholdStatus = async (req, res) => {
  try {
    const updated = await prisma.household.update({
      where: { id: Number(req.params.id) },
      data: { status: Number(req.body.status) }
    })

    return res.status(200).json({
      success: true,
      message: "Status updated",
      data: updated
    })

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}
