import type { Request, Response } from "express";

export async function handleSignOut(req: Request, res: Response) {
  res.json({ msg: "sample msg" });
}
