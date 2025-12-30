import prisma from "../../../prisma/prismaClient.js"
import PDFDocument from "pdfkit"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const FONT_REG = path.join(__dirname, "../../../assets/font/TIMES.TTF")
const FONT_BOLD = path.join(__dirname, "../../../assets/font/TIMESBD.TTF")
const FONT_ITALIC = path.join(__dirname, "../../../assets/font/TIMESI.TTF")
const FONT_BOLD_ITALIC = path.join(__dirname, "../../../assets/font/TIMESBI.TTF")

const vnd = (n) => new Intl.NumberFormat("vi-VN").format(Number(n ?? 0))
const dmy = (d) => (d ? new Date(d).toLocaleDateString("vi-VN") : "—")

export const downloadInvoicePdf = async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ message: "Unauthorized." })

    const feeRecordId = Number(req.params.feeRecordId)
    if (!Number.isInteger(feeRecordId) || feeRecordId <= 0) {
      return res.status(400).json({ message: "Invalid feeRecordId." })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { householdId: true }
    })
    if (!user?.householdId) return res.status(400).json({ message: "Household information not found." })

    const record = await prisma.feeRecord.findFirst({
      where: { id: feeRecordId, householdId: user.householdId },
      include: {
        feeType: true,
        household: true,
        manager: { select: { fullname: true, username: true } }
      }
    })
    if (!record) return res.status(404).json({ message: "Invoice not found." })

    if (record.status !== 2) {
      return res.status(400).json({ message: "This fee record is not paid yet." })
    }

    let responded = false

    const doc = new PDFDocument({ size: "A4", margin: 50 })
    const chunks = []

    doc.on("data", (c) => chunks.push(c))

    doc.on("error", (err) => {
      console.error("PDFKit error:", err)
      if (!responded) {
        responded = true
        return res.status(500).json({ message: "Failed to generate PDF." })
      }
    })

    doc.on("end", () => {
      if (responded) return
      responded = true

      const pdfBuffer = Buffer.concat(chunks)
      const fileName = `invoice_${record.id}.pdf`

      res.status(200)
      res.setHeader("Content-Type", "application/pdf")
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`)
      res.setHeader("Content-Length", pdfBuffer.length)

      return res.end(pdfBuffer)
    })

    doc.registerFont("vi", FONT_REG)
    doc.registerFont("vi-bold", FONT_BOLD)
    doc.registerFont("vi-italic", FONT_ITALIC)
    doc.registerFont("vi-bold-italic", FONT_BOLD_ITALIC)

    const statusText = record.status === 2 ? "Đã thanh toán" : record.status === 1 ? "Một phần" : "Chưa thanh toán"

    doc.font("vi-bold").fontSize(18).text("HÓA ĐƠN ĐIỆN TỬ", { align: "center" })
    doc.moveDown(0.25)
    doc.font("vi").fontSize(10).text(`Mã hóa đơn: #${record.id}`, { align: "center" })
    doc.font("vi").text(`Ngày lập: ${dmy(record.createdAt)}`, { align: "center" })
    doc.moveDown(1)

    doc.font("vi-bold").fontSize(12).text("Thông tin hộ khẩu", { underline: true })
    doc.moveDown(0.3)
    doc.font("vi").fontSize(11)
    doc.text(`Mã hộ khẩu: ${record.household?.householdCode ?? "-"}`)
    doc.text(`Địa chỉ: ${record.household?.address ?? "-"}`)
    doc.moveDown(0.8)

    doc.font("vi-bold").fontSize(12).text("Thông tin khoản thu", { underline: true })
    doc.moveDown(0.3)
    doc.font("vi").fontSize(11)
    doc.text(`Tên khoản thu: ${record.feeType?.name ?? "-"}`)
    doc.text(`Loại: ${record.feeType?.isMandatory ? "Bắt buộc" : "Đóng góp"}`)
    doc.text(`Mô tả: ${record.feeType?.shortDescription ?? record.feeType?.longDescription ?? "-"}`)
    doc.text(`Từ ngày: ${dmy(record.feeType?.fromDate)}    Đến ngày: ${dmy(record.feeType?.toDate)}`)
    doc.moveDown(0.8)

    doc.font("vi-bold").fontSize(12).text("Thông tin thanh toán", { underline: true })
    doc.moveDown(0.3)
    doc.font("vi").fontSize(11)
    doc.text(`Số tiền: ${vnd(record.amount)} VND`)
    doc.text(`Trạng thái: ${statusText}`)
    doc.text(`Phương thức: ${String(record.method)}`)
    doc.text(`Ghi chú: ${record.description ?? "-"}`)
    doc.moveDown(0.8)

    doc.text(`Người ghi nhận: ${record.manager?.fullname ?? record.manager?.username ?? "-"}`)
    doc.moveDown(2)

    doc.font("vi-italic").fontSize(10).text("Hóa đơn được sinh từ hệ thống quản lý tổ dân phố.", { align: "center" })
    doc.font("vi-italic").text("Vui lòng giữ hóa đơn để đối chiếu khi cần thiết.", { align: "center" })

    doc.end()
  } catch (error) {
    console.error("Error in downloadInvoicePdf:", error)
    return res.status(500).json({ message: "Server error while generating invoice PDF." })
  }
}

export const getPendingFees = async (req, res) => {
  try {
    const userId = req.user.id

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { householdId: true }
    })

    if (!user?.householdId) {
      return res.status(400).json({ message: "Household information not found." })
    }

    const householdId = user.householdId

    const residentsCount = await prisma.resident.count({
      where: {
        householdId,
        status: { in: [0, 1] }
      }
    })

    const mandatoryTypes = await prisma.feeType.findMany({
      where: {
        isMandatory: true,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        shortDescription: true,
        longDescription: true,
        isMandatory: true,
        unitPrice: true,
        fromDate: true,
        toDate: true,
        isActive: true
      },
      orderBy: [{ fromDate: "desc" }, { id: "desc" }]
    })

    const mandatoryTypeIds = mandatoryTypes.map((t) => t.id)

    const paidMandatory = mandatoryTypeIds.length
      ? await prisma.feeRecord.findMany({
        where: {
          householdId,
          feeTypeId: { in: mandatoryTypeIds },
          status: 2
        },
        select: { feeTypeId: true }
      })
      : []

    const paidSet = new Set(paidMandatory.map((r) => r.feeTypeId))

    const mandatoryFees = mandatoryTypes
      .filter((t) => !paidSet.has(t.id))
      .map((fee) => {
        const unitPrice = Number(fee.unitPrice ?? 0)
        const totalAmount = unitPrice * residentsCount
        return {
          ...fee,
          residentsCount,
          totalAmount
        }
      })

    const contributionTypesRaw = await prisma.feeType.findMany({
      where: {
        isMandatory: false,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        shortDescription: true,
        longDescription: true,
        isMandatory: true,
        unitPrice: true,
        fromDate: true,
        toDate: true,
        isActive: true,
        feeRecords: {
          where: { status: 2 },
          select: { amount: true, householdId: true }
        }
      },
      orderBy: [{ fromDate: "desc" }, { id: "desc" }]
    })

    const contributionFees = contributionTypesRaw.map((type) => {
      const records = type.feeRecords ?? []

      const totalCommunityDonated = records.reduce((sum, r) => sum + Number(r.amount ?? 0), 0)

      const myPaidAmount = records
        .filter((r) => r.householdId === householdId)
        .reduce((sum, r) => sum + Number(r.amount ?? 0), 0)

      const paidByHousehold = myPaidAmount > 0

      const { feeRecords, ...rest } = type
      return {
        ...rest,
        totalCommunityDonated,
        myPaidAmount,
        paidByHousehold
      }
    })

    return res.json({
      mandatoryFees,
      contributionFees
    })
  } catch (error) {
    console.error("Error in getPendingFees:", error)
    return res.status(500).json({ message: "Server error." })
  }
}

export const getFeeHistory = async (req, res) => {
  try {
    const userId = req.user.id

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { householdId: true }
    })

    if (!user?.householdId) {
      return res.status(400).json({ message: "Invalid household information." })
    }

    const history = await prisma.feeRecord.findMany({
      where: {
        householdId: user.householdId
      },
      include: {
        feeType: {
          select: {
            id: true,
            name: true,
            shortDescription: true,
            longDescription: true,
            isMandatory: true,
            unitPrice: true,
            fromDate: true,
            toDate: true
          }
        }
      },
      orderBy: { updatedAt: "desc" }
    })

    const paidOnly = history.filter((x) => x.status === 2)

    const totalPaid = paidOnly.reduce((sum, item) => sum + Number(item.amount ?? 0), 0)

    const totalMandatory = paidOnly
      .filter((f) => f.feeType?.isMandatory)
      .reduce((sum, item) => sum + Number(item.amount ?? 0), 0)

    return res.json({
      history,
      statistics: {
        totalPaid,
        totalMandatory,
        totalContribution: totalPaid - totalMandatory
      }
    })
  } catch (error) {
    console.error("Error in getFeeHistory:", error)
    return res.status(500).json({ message: "Server error while fetching fee history." })
  }
}

export const processPayment = async (req, res) => {
  const paymentMethod = "ONLINE"

  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ message: "Unauthorized." })

    const { type, feeTypeIds, donations } = req.body

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { householdId: true }
    })

    if (!user?.householdId) {
      return res.status(400).json({ message: "Household information not found." })
    }

    const householdId = user.householdId

    if (type === "MANDATORY") {
      if (!feeTypeIds || !Array.isArray(feeTypeIds) || feeTypeIds.length === 0) {
        return res.status(400).json({ message: "Invalid fee type list." })
      }

      const ids = feeTypeIds.map((x) => Number(x)).filter((x) => Number.isInteger(x) && x > 0)
      if (ids.length === 0) return res.status(400).json({ message: "Invalid fee type list." })

      const residentsCount = await prisma.resident.count({
        where: {
          householdId,
          status: { in: [0, 1] }
        }
      })

      const types = await prisma.feeType.findMany({
        where: {
          id: { in: ids },
          isMandatory: true,
          isActive: true
        },
        select: {
          id: true,
          unitPrice: true,
          name: true
        }
      })

      if (types.length === 0) {
        return res.status(400).json({ message: "No valid mandatory fee types found." })
      }

      const results = await prisma.$transaction(async (tx) => {
        const out = []

        for (const t of types) {
          const unitPrice = Number(t.unitPrice ?? 0)
          const amount = unitPrice * residentsCount

          const existing = await tx.feeRecord.findFirst({
            where: { householdId, feeTypeId: t.id },
            orderBy: { createdAt: "desc" },
            select: { id: true, status: true }
          })

          if (existing) {
            if (existing.status === 2) {
              out.push({ feeTypeId: t.id, action: "skip_paid" })
              continue
            }

            await tx.feeRecord.update({
              where: { id: existing.id },
              data: {
                amount,
                status: 2,
                method: paymentMethod,
                householdId,
                feeTypeId: t.id,
                description: `${t.name} (${residentsCount} nhân khẩu)`,
                managerId: userId
              }
            })

            out.push({ feeTypeId: t.id, action: "update_to_paid" })
            continue
          }

          await tx.feeRecord.create({
            data: {
              amount,
              status: 2,
              method: paymentMethod,
              householdId,
              feeTypeId: t.id,
              description: `${t.name} (${residentsCount} nhân khẩu)`,
              managerId: userId
            }
          })

          out.push({ feeTypeId: t.id, action: "create_paid" })
        }

        return out
      })


      const createdCount = results.filter((r) => r?.action === "create_paid").length
      const updatedCount = results.filter((r) => r?.action === "update_to_paid").length
      const skippedCount = results.filter((r) => r?.action === "skip_paid").length

      return res.json({
        message: "Mandatory fee payment completed successfully.",
        createdCount,
        updatedCount,
        skippedCount
      })
    }

    if (type === "CONTRIBUTION") {
      if (!donations || !Array.isArray(donations) || donations.length === 0) {
        return res.status(400).json({ message: "Invalid donation list." })
      }

      const normalized = donations
        .map((d) => ({
          feeTypeId: Number(d?.feeTypeId),
          amount: Number(d?.amount)
        }))
        .filter((d) => Number.isInteger(d.feeTypeId) && d.feeTypeId > 0 && Number.isFinite(d.amount) && d.amount > 0)

      if (normalized.length === 0) {
        return res.status(400).json({ message: "Invalid donation list." })
      }

      const typeIds = [...new Set(normalized.map((d) => d.feeTypeId))]

      const validTypes = await prisma.feeType.findMany({
        where: {
          id: { in: typeIds },
          isMandatory: false,
          isActive: true
        },
        select: { id: true }
      })

      const validSet = new Set(validTypes.map((t) => t.id))
      const finalDonations = normalized.filter((d) => validSet.has(d.feeTypeId))

      if (finalDonations.length === 0) {
        return res.status(400).json({ message: "No valid contribution fee types found." })
      }

      await prisma.$transaction(
        finalDonations.map((donation) =>
          prisma.feeRecord.create({
            data: {
              amount: donation.amount,
              status: 2,
              method: paymentMethod,
              householdId,
              feeTypeId: donation.feeTypeId,
              description: "Đóng góp tự nguyện qua ứng dụng cư dân",
              managerId: userId
            }
          })
        )
      )

      return res.json({
        message: "Donation submitted successfully. Thank you for your generosity!"
      })
    }

    return res.status(400).json({ message: "Invalid payment type." })
  } catch (error) {
    console.error("Error in processPayment:", error)
    return res.status(500).json({ message: "Server error while processing payment." })
  }
}
