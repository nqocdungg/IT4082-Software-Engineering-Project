import prisma from "../../../prisma/prismaClient.js";

export const getAllFees = async (req, res) => {
  try {
    const feeTypes = await prisma.feeType.findMany({
      orderBy: { id: "desc" },
    });

    const mapped = feeTypes.map((f) => ({
      id: f.id,
      name: f.name,
      shortDescription: f.shortDescription,
      longDescription: f.longDescription,
      isMandatory: f.isMandatory,
      unitPrice: f.unitPrice, // có thể null nếu đóng góp
      status: f.isActive ? 1 : 0,
      fromDate: f.fromDate,
      toDate: f.toDate,
    }));

    res.status(200).json(mapped);
  } catch (error) {
    console.error("GET /api/fees/list error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const createFee = async (req, res) => {
  const { name, shortDescription, longDescription, isMandatory, unitPrice, fromDate, toDate } = req.body;

  try {
    const cleanName = String(name || "").trim();
    if (!cleanName) {
      return res.status(400).json({ message: "Tên khoản thu không được để trống" });
    }

    const mandatoryBool = Boolean(isMandatory);

    // ✅ Nếu BẮT BUỘC: bắt buộc unitPrice > 0
    // ✅ Nếu ĐÓNG GÓP: unitPrice có thể null
    let priceValue = null;
    if (mandatoryBool) {
      const priceNum = Number(unitPrice);
      if (!Number.isFinite(priceNum) || priceNum <= 0) {
        return res.status(400).json({
          message: "Khoản thu bắt buộc phải có đơn giá > 0 (tính theo nhân khẩu).",
        });
      }
      priceValue = priceNum;
    } else {
      // đóng góp: cho phép null/0, nhưng nếu user nhập thì parse
      if (unitPrice !== undefined && unitPrice !== null && String(unitPrice) !== "") {
        const priceNum = Number(unitPrice);
        if (!Number.isFinite(priceNum) || priceNum < 0) {
          return res.status(400).json({ message: "Đơn giá không hợp lệ" });
        }
        priceValue = priceNum;
      } else {
        priceValue = null;
      }
    }

    const newFeeType = await prisma.feeType.create({
      data: {
        name: cleanName,
        shortDescription: shortDescription ? String(shortDescription) : null,
        longDescription: longDescription ? String(longDescription) : null,
        isMandatory: mandatoryBool,
        unitPrice: priceValue,
        fromDate: fromDate ? new Date(fromDate) : null,
        toDate: toDate ? new Date(toDate) : null,
        isActive: true,
      },
    });

    if (newFeeType.isMandatory && newFeeType.isActive) {
      const householdUsers = await prisma.user.findMany({
        where: { role: "HOUSEHOLD", isActive: true },
        select: { id: true }
      });

      if (householdUsers.length > 0) {
        const notification = await prisma.notification.create({
          data: {
            title: `🔔 Thông báo thu phí: ${newFeeType.name}`,
            message: `Ban quản lý vừa triển khai khoản thu bắt buộc mới: "${newFeeType.name}". Đơn giá: ${newFeeType.unitPrice?.toLocaleString('vi-VN')} VNĐ/nhân khẩu. Vui lòng kiểm tra và đóng phí đúng hạn.`,
            type: "FEE_ANNOUNCEMENT",
            relatedId: newFeeType.id,
          }
        });

        const recipients = householdUsers.map(u => ({
          userId: u.id,
          notificationId: notification.id,
          isRead: false
        }));

        await prisma.notificationRecipient.createMany({ data: recipients });
        console.log(`[AUTO-NOTI] Đã gửi thông báo phí mới tới ${householdUsers.length} hộ.`);
      }
    }

    res.status(201).json({
      message: "Fee created successfully",
      data: {
        id: newFeeType.id,
        name: newFeeType.name,
        shortDescription: newFeeType.shortDescription,
        longDescription: newFeeType.longDescription,
        isMandatory: newFeeType.isMandatory,
        unitPrice: newFeeType.unitPrice,
        status: newFeeType.isActive ? 1 : 0,
        fromDate: newFeeType.fromDate,
        toDate: newFeeType.toDate,
      },
    });
  } catch (error) {
    console.error("POST /api/fees/create error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const updateFee = async (req, res) => {
  const { id } = req.params;
  const { name, shortDescription, longDescription, isMandatory, unitPrice, status, fromDate, toDate } = req.body;

  try {
    const feeTypeId = parseInt(id, 10);
    if (!feeTypeId) return res.status(400).json({ message: "id không hợp lệ" });

    // lấy hiện trạng để validate theo isMandatory mới/ cũ
    const current = await prisma.feeType.findUnique({
      where: { id: feeTypeId },
      select: { id: true, isMandatory: true },
    });
    if (!current) return res.status(404).json({ message: "FeeType không tồn tại" });

    const nextIsMandatory =
      isMandatory !== undefined ? Boolean(isMandatory) : Boolean(current.isMandatory);

    const data = {};

    if (name !== undefined) {
      const cleanName = String(name || "").trim();
      if (!cleanName) return res.status(400).json({ message: "Tên khoản thu không được để trống" });
      data.name = cleanName;
    }

    if (shortDescription !== undefined)
      data.shortDescription = shortDescription ? String(shortDescription) : null

    if (longDescription !== undefined)
      data.longDescription = longDescription ? String(longDescription) : null


    if (isMandatory !== undefined) data.isMandatory = Boolean(isMandatory);

    if (unitPrice !== undefined) {
      // ✅ bắt buộc: unitPrice > 0
      // ✅ đóng góp: unitPrice nullable
      if (nextIsMandatory) {
        const priceNum = Number(unitPrice);
        if (!Number.isFinite(priceNum) || priceNum <= 0) {
          return res.status(400).json({ message: "Khoản thu bắt buộc phải có đơn giá > 0." });
        }
        data.unitPrice = priceNum;
      } else {
        if (unitPrice === "" || unitPrice === null) data.unitPrice = null;
        else {
          const priceNum = Number(unitPrice);
          if (!Number.isFinite(priceNum) || priceNum < 0) {
            return res.status(400).json({ message: "Đơn giá không hợp lệ" });
          }
          data.unitPrice = priceNum;
        }
      }
    }

    if (status !== undefined) data.isActive = Number(status) === 1;

    if (fromDate !== undefined) data.fromDate = fromDate ? new Date(fromDate) : null;
    if (toDate !== undefined) data.toDate = toDate ? new Date(toDate) : null;

    const updated = await prisma.feeType.update({
      where: { id: feeTypeId },
      data,
    });

    res.status(200).json({
      message: "Updated successfully",
      data: {
        id: updated.id,
        name: updated.name,
        shortDescription: updated.shortDescription,
        longDescription: updated.longDescription,
        isMandatory: updated.isMandatory,
        unitPrice: updated.unitPrice,
        status: updated.isActive ? 1 : 0,
        fromDate: updated.fromDate,
        toDate: updated.toDate,
      },
    });
  } catch (error) {
    console.error("PUT /api/fees/update error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteFee = async (req, res) => {
  const { id } = req.params;

  try {
    const feeTypeId = parseInt(id, 10);
    if (!feeTypeId) return res.status(400).json({ message: "id không hợp lệ" });

    const record = await prisma.feeRecord.findFirst({
      where: { feeTypeId },
      select: { id: true },
    });

    if (record) {
      return res.status(400).json({
        message: "Không thể xóa khoản thu đã có lịch sử thu. Hãy chuyển trạng thái sang ngừng áp dụng.",
      });
    }

    await prisma.feeType.delete({
      where: { id: feeTypeId },
    });

    res.status(200).json({ message: "Fee deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/fees/delete error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const createTransaction = async (req, res) => {
  const { feeId, householdId, amount, note} = req.body;

  try {
    const feeTypeId = parseInt(feeId, 10);
    const hhId = parseInt(householdId, 10);
    const payAmount = Number(amount);

    const role = req.user?.role;

    if (role === "HOUSEHOLD") {
      return res.status(403).json({
        message: "Cư dân không được phép thao tác chức năng thu tiền của ban quản lý",
      });
    }

    const paymentMethod = "OFFLINE";


    if (!feeTypeId || !hhId || !Number.isFinite(payAmount) || payAmount <= 0) {
      return res.status(400).json({ message: "Dữ liệu thu phí không hợp lệ" });
    }

    const feeType = await prisma.feeType.findUnique({
      where: { id: feeTypeId },
      select: { id: true, name: true, isMandatory: true, unitPrice: true, isActive: true },
    });

    const household = await prisma.household.findUnique({
      where: { id: hhId },
      select: {
        id: true,
        householdCode: true,
        residents: { select: { status: true } },
      },
    });

    if (!feeType || !household) {
      return res.status(404).json({ message: "FeeType hoặc Household không tồn tại" });
    }

    if (!feeType.isActive) {
      return res.status(400).json({ message: "Khoản thu đang ngừng áp dụng" });
    }

    if (!feeType.isMandatory) {
      const manager = await prisma.user.findFirst({
        where: {
          role: { in: ["ACCOUNTANT", "HEAD", "DEPUTY"] },
          isActive: true,
        },
        select: { id: true, fullname: true, role: true },
      });


      if (!manager) {
        return res.status(400).json({ message: "Không tìm thấy cán bộ quản lý để ghi nhận thu" });
      }

      const newRecord = await prisma.feeRecord.create({
        data: {
          amount: payAmount,
          status: 2, 
          method: paymentMethod,
          description: note || "",
          householdId: hhId,
          feeTypeId: feeTypeId,
          managerId: manager.id,
        },
        include: {
          feeType: { select: { id: true, name: true, isMandatory: true, unitPrice: true } },
          household: { select: { id: true, householdCode: true } },
          manager: { select: { id: true, fullname: true, role: true } },
        },
      });

      return res.status(201).json({
        message: "Transaction created successfully",
        data: {
          id: newRecord.id,
          amount: newRecord.amount,
          status: newRecord.status,
          note: newRecord.description,
          date: newRecord.createdAt,
          fee: newRecord.feeType,
          household: newRecord.household,
          manager: newRecord.manager,
        },
      });
    }

    // ✅ BẮT BUỘC: tính theo nhân khẩu + check remaining
    const unitPrice = Number(feeType.unitPrice);
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      return res.status(400).json({
        message: "Khoản thu bắt buộc chưa có đơn giá hợp lệ (>0). Hãy cập nhật đơn giá trước khi thu.",
      });
    }

    const activeStatuses = [0, 1];
    const memberCount = (household.residents || []).filter((r) =>
      activeStatuses.includes(Number(r.status))
    ).length;

    const expected = unitPrice * memberCount;

    const paidAgg = await prisma.feeRecord.aggregate({
      where: {
        feeTypeId,
        householdId: hhId,
        status: { in: [1, 2] }
      },
      _sum: { amount: true },
    });


    const paidSoFar = Number(paidAgg?._sum?.amount) || 0;
    const remainingBefore = Math.max(expected - paidSoFar, 0);

    if (remainingBefore <= 0) {
      return res.status(400).json({ message: "Hộ này đã thu đủ khoản này" });
    }

    if (payAmount > remainingBefore) {
      return res.status(400).json({ message: "Số tiền thu lần này vượt quá số tiền còn thiếu" });
    }

    const recordStatus = payAmount >= remainingBefore ? 2 : 1;

    const manager = await prisma.user.findFirst({
      where: {
        role: { in: ["ACCOUNTANT", "HEAD", "DEPUTY"] },
        isActive: true,
      },
      select: { id: true, fullname: true, role: true },
    });


    if (!manager) {
      return res.status(400).json({ message: "Không tìm thấy cán bộ quản lý để ghi nhận thu" });
    }

    const newRecord = await prisma.feeRecord.create({
      data: {
        amount: payAmount,
        status: recordStatus,
        method: paymentMethod,
        description: note || "",
        householdId: hhId,
        feeTypeId: feeTypeId,
        managerId: manager.id,
      },
      include: {
        feeType: { select: { id: true, name: true, isMandatory: true, unitPrice: true } },
        household: { select: { id: true, householdCode: true } },
        manager: { select: { id: true, fullname: true, role: true } },
      },
    });

    res.status(201).json({
      message: "Transaction created successfully",
      data: {
        id: newRecord.id,
        amount: newRecord.amount,
        status: newRecord.status,
        note: newRecord.description,
        date: newRecord.createdAt,
        fee: newRecord.feeType,
        household: newRecord.household,
        manager: newRecord.manager,
      },
    });
  } catch (error) {
    console.error("POST /api/fees/pay error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getTransactions = async (req, res) => {
  const { feeId, householdId, method } = req.query;
  const whereClause = {};

  if (feeId) whereClause.feeTypeId = parseInt(feeId, 10);
  if (householdId) whereClause.householdId = parseInt(householdId, 10);

  if (method === "ONLINE" || method === "OFFLINE") {
    whereClause.method = method;
  }

  try {
    const history = await prisma.feeRecord.findMany({
      where: whereClause,
      include: {
        feeType: { select: { id: true, name: true, isMandatory: true, unitPrice: true } },
        household: { select: { id: true, householdCode: true } },
        manager: { select: { id: true, fullname: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const mapped = history.map((r) => ({
      id: r.id,
      amount: r.amount,
      status: r.status,
      method: r.method,
      note: r.description,
      date: r.updatedAt,
      fee: r.feeType,
      household: r.household,
      manager: r.manager,
    }));

    res.status(200).json(mapped);
  } catch (error) {
    console.error("GET /api/fees/history error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getFeeSummary = async (req, res) => {
  const { feeId } = req.query;

  try {
    const feeTypeId = parseInt(feeId, 10);
    if (!feeTypeId) return res.status(400).json({ message: "feeId không hợp lệ" });

    const fee = await prisma.feeType.findUnique({
      where: { id: feeTypeId },
      select: { id: true, unitPrice: true, isMandatory: true, name: true, isActive: true },
    });
    if (!fee) return res.status(404).json({ message: "FeeType không tồn tại" });

    const households = await prisma.household.findMany({
      orderBy: { id: "asc" },
      where: { status: 1 },
      select: {
        id: true,
        householdCode: true,
        residents: { select: { status: true } },
      },
    });

    const paidByHousehold = await prisma.feeRecord.groupBy({
      by: ["householdId"],
      where: { 
        feeTypeId, 
        status: { in: [1, 2] } // partial + paid
      },
      _sum: { amount: true },
    });

    const paidMap = new Map(
      paidByHousehold.map((x) => [x.householdId, Number(x._sum.amount) || 0])
    );

    const activeStatuses = [0, 1];

    const rows = households.map((hh) => {
      const memberCount = (hh.residents || []).filter((r) =>
        activeStatuses.includes(Number(r.status))
      ).length;

      const paid = paidMap.get(hh.id) || 0;

      // ✅ ĐÓNG GÓP: không có expected/remaining theo nghiệp vụ
      if (!fee.isMandatory) {
        return {
          household: { id: hh.id, householdCode: hh.householdCode },
          fee: { id: fee.id, unitPrice: fee.unitPrice, isMandatory: fee.isMandatory },
          memberCount,
          expected: 0,
          paid,
          remaining: 0,
          status: paid > 0 ? 2 : 0, // đã đóng góp / chưa đóng góp
        };
      }

      // ✅ BẮT BUỘC
      const unitPrice = Number(fee.unitPrice);
      const safeUnitPrice = Number.isFinite(unitPrice) && unitPrice > 0 ? unitPrice : 0;

      const expected = safeUnitPrice * memberCount;
      const remaining = Math.max(expected - paid, 0);
      const summaryStatus = remaining <= 0 ? 2 : paid <= 0 ? 0 : 1;

      return {
        household: { id: hh.id, householdCode: hh.householdCode },
        fee: { id: fee.id, unitPrice: safeUnitPrice, isMandatory: fee.isMandatory },
        memberCount,
        expected,
        paid,
        remaining,
        status: summaryStatus,
      };
    });

    res.status(200).json(rows);
  } catch (error) {
    console.error("GET /api/fees/summary error:", error);
    res.status(500).json({ error: error.message });
  }
};
export const updateTransaction = async (req, res) => {
  const { id } = req.params
  const { amount, note } = req.body

  try {
    const recordId = parseInt(id, 10)
    const nextAmount = Number(amount)

    const role = req.user?.role
    if (role === "HOUSEHOLD") {
      return res.status(403).json({
        message: "Cư dân không được phép thao tác chức năng thu tiền của ban quản lý",
      })
    }

    if (!recordId || !Number.isFinite(nextAmount) || nextAmount <= 0) {
      return res.status(400).json({ message: "Số tiền chỉnh sửa không hợp lệ" })
    }

    const current = await prisma.feeRecord.findUnique({
      where: { id: recordId },
      select: { id: true, feeTypeId: true, householdId: true, amount: true }
    })
    if (!current) return res.status(404).json({ message: "Giao dịch không tồn tại" })

    const feeType = await prisma.feeType.findUnique({
      where: { id: current.feeTypeId },
      select: { id: true, isMandatory: true, unitPrice: true, isActive: true }
    })
    if (!feeType) return res.status(404).json({ message: "FeeType không tồn tại" })
    if (!feeType.isActive) return res.status(400).json({ message: "Khoản thu đang ngừng áp dụng" })

    const household = await prisma.household.findUnique({
      where: { id: current.householdId },
      select: { id: true, residents: { select: { status: true } } }
    })
    if (!household) return res.status(404).json({ message: "Household không tồn tại" })

    // ===== ĐÓNG GÓP (tự nguyện) =====
    if (!feeType.isMandatory) {
      const aggAll = await prisma.feeRecord.aggregate({
        where: { feeTypeId: current.feeTypeId, householdId: current.householdId },
        _sum: { amount: true }
      })
      const totalBefore = Number(aggAll?._sum?.amount) || 0
      const totalAfter = totalBefore - Number(current.amount) + nextAmount

      if (totalAfter < 0) {
        return res.status(400).json({ message: "Không thể chỉnh làm tổng đóng góp < 0" })
      }

      const nextStatus = totalAfter > 0 ? 2 : 0

      const updated = await prisma.feeRecord.update({
        where: { id: recordId },
        data: {
          amount: nextAmount,
          status: nextStatus,
          description: note !== undefined ? (note || "") : undefined
        },
        include: {
          feeType: { select: { id: true, name: true, isMandatory: true, unitPrice: true } },
          household: { select: { id: true, householdCode: true } },
          manager: { select: { id: true, fullname: true, role: true } }
        }
      })

      return res.status(200).json({
        message: "Updated successfully",
        data: {
          id: updated.id,
          amount: updated.amount,
          status: updated.status,
          note: updated.description,
          date: updated.updatedAt,
          fee: updated.feeType,
          household: updated.household,
          manager: updated.manager
        }
      })
    }

    // ===== BẮT BUỘC =====
    const unitPrice = Number(feeType.unitPrice)
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      return res.status(400).json({
        message: "Khoản thu bắt buộc chưa có đơn giá hợp lệ (>0). Hãy cập nhật đơn giá trước khi sửa.",
      })
    }

    const activeStatuses = [0, 1]
    const memberCount = (household.residents || []).filter((r) =>
      activeStatuses.includes(Number(r.status))
    ).length
    const expected = unitPrice * memberCount

    const aggAll = await prisma.feeRecord.aggregate({
      where: { feeTypeId: current.feeTypeId, householdId: current.householdId },
      _sum: { amount: true }
    })
    const paidBefore = Number(aggAll?._sum?.amount) || 0
    const paidAfter = paidBefore - Number(current.amount) + nextAmount

    if (paidAfter < 0) return res.status(400).json({ message: "Không thể chỉnh làm số đã thu < 0" })
    if (paidAfter > expected) {
      return res.status(400).json({ message: "Không thể chỉnh làm số đã thu vượt quá số tiền cần thu" })
    }

    const remainingAfter = Math.max(expected - paidAfter, 0)
    const nextStatus = remainingAfter <= 0 ? 2 : paidAfter <= 0 ? 0 : 1

    const updated = await prisma.feeRecord.update({
      where: { id: recordId },
      data: {
        amount: nextAmount,
        status: nextStatus,
        description: note !== undefined ? (note || "") : undefined
      },
      include: {
        feeType: { select: { id: true, name: true, isMandatory: true, unitPrice: true } },
        household: { select: { id: true, householdCode: true } },
        manager: { select: { id: true, fullname: true, role: true } }
      }
    })

    res.status(200).json({
      message: "Updated successfully",
      data: {
        id: updated.id,
        amount: updated.amount,
        status: updated.status,
        note: updated.description,
        date: updated.updatedAt,
        fee: updated.feeType,
        household: updated.household,
        manager: updated.manager
      }
    })
  } catch (error) {
    console.error("PATCH /api/fees/history/:id error:", error)
    res.status(500).json({ error: error.message })
  }
}
