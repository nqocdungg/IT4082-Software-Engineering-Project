import prisma from '../../prisma/prismaClient.js';

export const getAllFees = async (req, res) => {
    try {
        const fees = await prisma.fee.findMany({
            orderBy: { id: 'desc' }
        });
        res.status(200).json(fees);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createFee = async (req, res) => {
    const { name, description, isMandatory, unitPrice } = req.body;
    try {
        const newFee = await prisma.fee.create({
            data: {
                name,
                description,
                isMandatory: Boolean(isMandatory),
                unitPrice: parseFloat(unitPrice) || 0,
                status: 1 // Active
            }
        });
        res.status(201).json({ message: "Fee created successfully", data: newFee });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateFee = async (req, res) => {
    const { id } = req.params;
    const { name, description, isMandatory, unitPrice, status } = req.body;
    try {
        const updatedFee = await prisma.fee.update({
            where: { id: parseInt(id) },
            data: {
                name,
                description,
                isMandatory: isMandatory !== undefined ? Boolean(isMandatory) : undefined,
                unitPrice: unitPrice !== undefined ? parseFloat(unitPrice) : undefined,
                status: status !== undefined ? parseInt(status) : undefined
            }
        });
        res.status(200).json({ message: "Updated successfully", data: updatedFee });
    } catch (error) {
        res.status(500).json({ error: "Fee not found or server error" });
    }
};

export const deleteFee = async (req, res) => {
    const { id } = req.params;
    try {
        const transactions = await prisma.transaction.findFirst({
            where: { feeId: parseInt(id) }
        });

        if (transactions) {
            return res.status(400).json({ message: "Cannot delete a fee that has existing transactions. Please set its status to inactive instead." });
        }

        await prisma.fee.delete({ where: { id: parseInt(id) } });
        res.status(200).json({ message: "Fee deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createTransaction = async (req, res) => {
    const { feeId, householdId, amount, note } = req.body;
    try {
        const fee = await prisma.fee.findUnique({ where: { id: parseInt(feeId) } });
        const household = await prisma.household.findUnique({ where: { id: parseInt(householdId) } });

        if (!fee || !household) {
            return res.status(404).json({ message: "Fee or household does not exist" });
        }

        const newTransaction = await prisma.transaction.create({
            data: {
                feeId: parseInt(feeId),
                householdId: parseInt(householdId),
                amount: parseFloat(amount),
                note: note || "",
                date: new Date()
            }
        });

        res.status(201).json({ message: "Transaction created successfully", data: newTransaction });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getTransactions = async (req, res) => {
    const { feeId, householdId } = req.query;

    const whereClause = {};
    if (feeId) whereClause.feeId = parseInt(feeId);
    if (householdId) whereClause.householdId = parseInt(householdId);

    try {
        const history = await prisma.transaction.findMany({
            where: whereClause,
            include: {
                fee: { select: { name: true, isMandatory: true } },
                household: { select: { address: true, owner: { select: { fullname: true } } } }
            },
            orderBy: { date: 'desc' }
        });
        res.status(200).json(history);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};