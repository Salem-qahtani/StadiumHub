import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

type JwtPayload = {
  id: number;
  username: string;
  role: string;
};

function protect(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "no token provided" });
    return;
  }
  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    req.body.userId = decoded.id;
    req.body.username = decoded.username;
    req.body.userRole = decoded.role;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }
}
export default protect;
