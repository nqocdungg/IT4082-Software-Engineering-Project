import prisma from '../../prisma/prismaClient.js';
import bcrypt from 'bcryptjs';

export const getAllStaff = async (req, res) => {
    try {
        const staffList = await prisma.user.findMany({
            select: {id: true, username: true, fullname: true, phone: true, role: true, createdAt: true}
        });
        res.status(200).json(staffList);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createStaff = async (req, res) => {
    const { username, password, fullname, phone, role } = req.body;
    try {
        const existingUser = await prisma.user.findUnique({ where: { username } });
        if (existingUser) return res.status(400).json({ message: "Username is valid" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newStaff = await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                fullname,
                phone,
                role: role 
            }
        });

        res.status(201).json({ message: "success", data: newStaff });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateStaff = async (req, res) => {
    const { id } = req.params;
    const { fullname, phone, role, password } = req.body;

    try {
        let updateData = { fullname, phone, role };
        if (password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(password, salt);
        }

        const updatedStaff = await prisma.user.update({
            where: { id: parseInt(id) },
            data: updateData
        });
        res.status(200).json({ message: "success", data: updatedStaff });
    } catch (error) {
        res.status(500).json({ error: "ID not found" });
    }
};

export const deleteStaff = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.user.delete({ where: { id: parseInt(id) } });
        res.status(200).json({ message: "success" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};