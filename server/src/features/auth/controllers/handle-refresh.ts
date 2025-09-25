import type { Request, Response } from "express";

export async function handleRefresh(req: Request, res: Response) {
  res.json({ msg: "sample msg" });
}
