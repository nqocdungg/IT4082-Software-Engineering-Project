import prisma from "../../prisma/prismaClient.js";

export const getAllFees = async (req, res) => {
  try {
    const feeTypes = await prisma.feeType.findMany({
      orderBy: { id: "desc" },
    });

    const mapped = feeTypes.map((f) => ({
      id: f.id,
      name: f.name,
      description: f.description,
      isMandatory: f.isMandatory,
      unitPrice: f.unitPrice ?? 0,
      status: f.isActive ? 1 : 0,
      fromDate: f.fromDate,
      toDate: f.toDate,
    }));

    console.log("GET /api/fees/list ->", mapped.length, "fees");
    res.status(200).json(mapped);
  } catch (error) {
    console.error("GET /api/fees/list error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const createFee = async (req, res) => {
  const { name, description, isMandatory, unitPrice, fromDate, toDate } = req.body;
  try {
    const newFeeType = await prisma.feeType.create({
      data: {
        name,
        description: description || "",
        isMandatory: Boolean(isMandatory),
        unitPrice:
          unitPrice === undefined || unitPrice === null || unitPrice === ""
            ? null
            : parseFloat(unitPrice),
        fromDate: fromDate ? new Date(fromDate) : null,
        toDate: toDate ? new Date(toDate) : null,
        isActive: true,
      },
    });

    const mapped = {
      id: newFeeType.id,
      name: newFeeType.name,
      description: newFeeType.description,
      isMandatory: newFeeType.isMandatory,
      unitPrice: newFeeType.unitPrice ?? 0,
      status: newFeeType.isActive ? 1 : 0,
      fromDate: newFeeType.fromDate,
      toDate: newFeeType.toDate,
    };

    res
      .status(201)
      .json({ message: "Fee created successfully", data: mapped });
  } catch (error) {
    console.error("POST /api/fees/create error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const updateFee = async (req, res) => {
  const { id } = req.params;
  const { name, description, isMandatory, unitPrice, status, fromDate, toDate } = req.body;
  try {
    const updated = await prisma.feeType.update({
      where: { id: parseInt(id) },
      data: {
        name,
        description,
        isMandatory:
          isMandatory !== undefined ? Boolean(isMandatory) : undefined,
        unitPrice:
          unitPrice !== undefined
            ? unitPrice === "" || unitPrice === null
              ? null
              : parseFloat(unitPrice)
            : undefined,
        isActive: status !== undefined ? status === 1 : undefined,
        fromDate:
          fromDate !== undefined
            ? fromDate
              ? new Date(fromDate)
              : null
            : undefined,
        toDate:
          toDate !== undefined
            ? toDate
              ? new Date(toDate)
              : null
            : undefined,
      },
    });

    const mapped = {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      isMandatory: updated.isMandatory,
      unitPrice: updated.unitPrice ?? 0,
      status: updated.isActive ? 1 : 0,
      fromDate: updated.fromDate,
      toDate: updated.toDate,
    };

    res.status(200).json({ message: "Updated successfully", data: mapped });
  } catch (error) {
    console.error("PUT /api/fees/update error:", error);
    res.status(500).json({ error: "Fee not found or server error" });
  }
};

export const deleteFee = async (req, res) => {
  const { id } = req.params;
  try {
    const records = await prisma.feeRecord.findFirst({
      where: { feeTypeId: parseInt(id) },
    });

    if (records) {
      return res.status(400).json({
        message:
          "Không thể xóa khoản thu đã có lịch sử thu. Hãy chuyển trạng thái sang ngừng áp dụng.",
      });
    }

    await prisma.feeType.delete({ where: { id: parseInt(id) } });
    res.status(200).json({ message: "Fee deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/fees/delete error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const createTransaction = async (req, res) => {
  const { feeId, householdId, amount, note } = req.body;
  try {
    const feeType = await prisma.feeType.findUnique({
      where: { id: parseInt(feeId) },
    });
    const household = await prisma.household.findUnique({
      where: { id: parseInt(householdId) },
    });

    if (!feeType || !household) {
      return res
        .status(404)
        .json({ message: "FeeType hoặc Household không tồn tại" });
    }

    const manager =
      (await prisma.user.findFirst({ where: { role: "HEAD" } })) ||
      (await prisma.user.findFirst({ where: { role: "DEPUTY" } }));

    if (!manager) {
      return res
        .status(400)
        .json({ message: "Không tìm thấy cán bộ quản lý để ghi nhận thu" });
    }

    const newRecord = await prisma.feeRecord.create({
      data: {
        description: note || "",
        fundAmount: parseFloat(amount),
        status: 2,
        isActive: true,
        householdId: parseInt(householdId),
        feeTypeId: parseInt(feeId),
        managerId: manager.id,
      },
      include: {
        feeType: { select: { name: true, isMandatory: true } },
        household: {
          select: {
            address: true,
            owner: { select: { fullname: true } },
          },
        },
      },
    });

    const mapped = {
      id: newRecord.id,
      amount: newRecord.fundAmount,
      note: newRecord.description,
      date: newRecord.updatedAt,
      fee: newRecord.feeType,
      household: newRecord.household,
    };

    res
      .status(201)
      .json({ message: "Transaction created successfully", data: mapped });
  } catch (error) {
    console.error("POST /api/fees/pay error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getTransactions = async (req, res) => {
  const { feeId, householdId } = req.query;

  const whereClause = {};
  if (feeId) whereClause.feeTypeId = parseInt(feeId);
  if (householdId) whereClause.householdId = parseInt(householdId);

  try {
    const history = await prisma.feeRecord.findMany({
      where: whereClause,
      include: {
        feeType: { select: { name: true, isMandatory: true } },
        household: {
          select: {
            address: true,
            owner: { select: { fullname: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const mapped = history.map((r) => ({
      id: r.id,
      amount: r.fundAmount,
      note: r.description,
      date: r.updatedAt,
      fee: r.feeType,
      household: r.household,
    }));

    console.log("GET /api/fees/history ->", mapped.length, "records");
    res.status(200).json(mapped);
  } catch (error) {
    console.error("GET /api/fees/history error:", error);
    res.status(500).json({ error: error.message });
  }
};
