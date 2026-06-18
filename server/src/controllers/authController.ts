import { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

async function signup(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, username, password, role } = req.body;

    if (!name?.trim() || !username?.trim() || !password?.trim() || !role?.trim()) {
      res.status(400).json({ error: "All fields are required" });
      return;
    }

    const allowedRoles = ["owner", "organizer"];
    if (!allowedRoles.includes(role)) {
      res.status(400).json({ error: "Invalid role" });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { username } });

    if (existingUser) {
      res.status(400).json({ error: "Username is taken" });
      return;
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        username,
        password: hashedPassword,
        role,
      },
    });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" },
    );
    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function signin(req: Request, res: Response, next: NextFunction) {
  try {
    const { username, password } = req.body;

    if (!username?.trim() || !password?.trim()) {
      res.status(400).json({ error: "Username and password are required" });
      return;
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      res.status(400).json({ error: "invalid username or password" });
      return;
    }
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      res.status(400).json({ error: "invalid username or password" });
      return;
    }
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" },
    );
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
}
export { signup, signin };
