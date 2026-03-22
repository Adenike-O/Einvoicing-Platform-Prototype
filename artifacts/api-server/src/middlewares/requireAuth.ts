import { Request, Response, NextFunction } from "express";
import { db, sessionsTable, usersTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";

declare global {
  namespace Express {
    interface Request {
      userId?: number;
      userEmail?: string;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.["session_token"];
  if (!token) {
    res.status(401).json({ error: "Unauthorized", message: "No session token" });
    return;
  }

  const session = await db
    .select({ userId: sessionsTable.userId })
    .from(sessionsTable)
    .where(and(eq(sessionsTable.token, token), gt(sessionsTable.expiresAt, new Date())))
    .limit(1);

  if (session.length === 0) {
    res.status(401).json({ error: "Unauthorized", message: "Invalid or expired session" });
    return;
  }

  req.userId = session[0].userId;
  next();
}
