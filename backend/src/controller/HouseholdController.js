import prisma from '../../prisma/prismaClient.js';

export const getAllHouseholds = async (req, res) => {
    try {
        const households = await prisma.household.findMany({
            include: { owner: true, residents: true }
        });
        res.status(200).json(households);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getHouseholdById = async (req, res) => {
    const { id } = req.params;
    try {
        const household = await prisma.household.findUnique({
            where: { id: parseInt(id) },
            include: { owner: true, residents: true, feeRecords: true }
        });
        if (!household) return res.status(404).json({ message: "Household not found" });
        res.status(200).json(household);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createHousehold = async (req, res) => {
    const { address, ownerCCCD, ownerName, ownerDob, ownerGender } = req.body;

    try {
        const result = await prisma.$transaction(async (tx) => {
            const newOwner = await tx.resident.create({
                data: {
                    residentCCCD: ownerCCCD,
                    fullname: ownerName,
                    dob: new Date(ownerDob),
                    gender: ownerGender,
                    relationToOwner: "HEAD",
                    status: 1,
                }
            });

            const newHousehold = await tx.household.create({
                data: {
                    address: address,
                    registrationDate: new Date(),
                    nbrOfResident: 1,
                    status: 1,
                    ownerId: newOwner.id
                }
            });

            await tx.resident.update({
                where: { id: newOwner.id },
                data: { householdId: newHousehold.id }
            });

            return newHousehold;
        });

        res.status(201).json({ message: "Household created successfully", data: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error creating household: " + error.message });
    }
};

export const addResidentToHousehold = async (req, res) => {
    const { householdId } = req.params;
    const { residentCCCD, fullname, dob, gender, relationToOwner } = req.body;

    try {
        const exist = await prisma.resident.findUnique({ where: { residentCCCD } });
        if (exist) return res.status(400).json({ message: "Citizen ID (CCCD) already exists" });

        const newResident = await prisma.resident.create({
            data: {
                residentCCCD,
                fullname,
                dob: new Date(dob),
                gender,
                relationToOwner,
                status: 1,
                householdId: parseInt(householdId)
            }
        });

        await prisma.household.update({
            where: { id: parseInt(householdId) },
            data: { nbrOfResident: { increment: 1 } }
        });

        res.status(201).json(newResident);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const changeHouseholdStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        const updated = await prisma.household.update({
            where: { id: parseInt(id) },
            data: { status: parseInt(status) }
        });
        res.status(200).json(updated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};