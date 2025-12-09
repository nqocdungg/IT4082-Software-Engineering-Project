import prisma from "../../prisma/prismaClient.js";

// GET /api/residents
export const getResidents = async (req, res) => {
  try {
    const { householdId, search, status, gender } = req.query;

    const where = {};

    if (householdId) {
      where.householdId = Number(householdId);
    }

    if (status && status !== "ALL") {
      where.status = Number(status);
    }

    if (gender && gender !== "ALL") {
      where.gender = gender === "Nam" ? "M" : "F";
    }

    if (search) {
      where.OR = [
        { fullname: { contains: search, mode: "insensitive" } },
        { residentCCCD: { contains: search, mode: "insensitive" } },
      ];
    }

    const residents = await prisma.resident.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        household: { select: { id: true, address: true } }
      }
    });

    return res.json({message: "Fetched residents", data: residents});
  } catch (err) {
    console.error("getResidents error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// GET /api/residents/stats
export const getResidentStats = async (req, res) => {
  try {
    const total = await prisma.resident.count();
    const thuongTru = await prisma.resident.count({ where: { status: 0 } });
    const tamTru = await prisma.resident.count({ where: { status: 1 } });
    const tamVang = await prisma.resident.count({ where: { status: 2 } });
    const daChuyenDi = await prisma.resident.count({ where: { status: 3 } });
    const daQuaDoi = await prisma.resident.count({ where: { status: 4 } });

    return res.json({
      message: "Fetched stats",
      data: {total,thuongTru,tamTru,tamVang,daChuyenDi,daQuaDoi}
    });
  } catch (err) {
    console.error("getResidentStats error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// GET /api/residents/:id
export const getResidentById = async (req, res) => {
  try {
    const { id } = req.params;

    const resident = await prisma.resident.findUnique({
      where: { id: Number(id) },
      include: {
        household: { select: { id: true, address: true } }
      }
    });

    if (!resident) {
      return res.status(404).json({ message: "Resident not found" });
    }

    return res.json({message: "Fetched resident", data: resident,});
  } catch (err) {
    console.error("getResidentById error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// POST /api/residents
export const createResident = async (req, res) => {
  try {
    const {residentCCCD,fullname,dob,gender,relationToOwner,status,householdId} = req.body;

    if (!residentCCCD || !fullname || !dob || !relationToOwner || !householdId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const existed = await prisma.resident.findUnique({
      where: { residentCCCD },
    });

    if (existed) {
      return res.status(400).json({ message: "CCCD already exists" });
    }

    const household = await prisma.household.findUnique({
      where: { id: Number(householdId) },
    });

    if (!household) {
      return res.status(400).json({ message: "Household not found" });
    }

    const newResident = await prisma.resident.create({
      data: {
        residentCCCD,
        fullname,
        dob: new Date(dob),
        gender,
        relationToOwner,
        status: Number(status ?? 0),
        householdId: Number(householdId),
      },
      include: {
        household: { select: { id: true, address: true } }
      }
    });

    return res.status(201).json({
      message: "Resident created",
      data: newResident,
    });
  } catch (err) {
    console.error("createResident error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// PUT /api/residents/:id
export const updateResident = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      residentCCCD,
      fullname,
      dob,
      gender,
      relationToOwner,
      status,
      householdId,
    } = req.body;

    const existing = await prisma.resident.findUnique({
      where: { id: Number(id) },
    });

    if (!existing) {
      return res.status(404).json({ message: "Resident not found" });
    }

    if (householdId) {
      const household = await prisma.household.findUnique({
        where: { id: Number(householdId) },
      });

      if (!household) {
        return res.status(400).json({ message: "Household not found" });
      }
    }

    const updated = await prisma.resident.update({
      where: { id: Number(id) },
      data: {
        residentCCCD: residentCCCD ?? existing.residentCCCD,
        fullname: fullname ?? existing.fullname,
        dob: dob ? new Date(dob) : existing.dob,
        gender: gender ?? existing.gender,
        relationToOwner: relationToOwner ?? existing.relationToOwner,
        status: status !== undefined ? Number(status) : existing.status,
        householdId: householdId ? Number(householdId) : existing.householdId,
      },
      include: {
        household: { select: { id: true, address: true } }
      }
    });

    return res.json({
      message: "Resident updated",
      data: updated,
    });
  } catch (err) {
    console.error("updateResident error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// DELETE /api/residents/:id
export const deleteResident = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.resident.findUnique({
      where: { id: Number(id) },
    });

    if (!existing) {
      return res.status(404).json({ message: "Resident not found" });
    }

    await prisma.resident.delete({
      where: { id: Number(id) },
    });

    return res.json({ message: "Resident deleted" });
  } catch (err) {
    console.error("deleteResident error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
