import type { Request, Response } from "express";

export async function handleRegister(req: Request, res: Response) {
  //  todo: validate if user exists
  const user = req.body;

  const isExistingUser: boolean = true;

  if (isExistingUser) {
    //  todo: log here
    res.status(409).json({ msg: "User already exists." });
  }

  // inserting user
  const inserted = {};

  // todo: add logging
  return inserted
    ? res.status(201).json({ msg: "User registration success." })
    : res.status(409).json({ msg: "User registration failed." });
}
