import type { Request, Response } from "express";

export async function handleSignIn(req: Request, res: Response) {
  res.json({ msg: "sample msg" });
}
