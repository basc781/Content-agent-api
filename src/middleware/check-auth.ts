import { getAuth } from "@clerk/express";
import { NextFunction, Request, Response } from "express";

export default function checkAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const auth = getAuth(req);

  if (!auth?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (!auth.orgId) {
    res.status(401).json({ error: "No active organization" });
    return;
  }

  next();
}
