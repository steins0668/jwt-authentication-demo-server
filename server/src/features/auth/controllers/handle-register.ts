import type { Request, Response } from "express";
import type { RegisterSchema } from "../schemas/register.schema";

export async function handleRegister(
  req: Request<{}, {}, RegisterSchema>,
  res: Response
) {
  //  todo: validate if user exists
  const { body: user, requestLogger, userDataService } = req;

  const foundUser = await userDataService.tryGetUser({
    type: "user",
    user,
  });

  if (foundUser) {
    const msg = "User already exists.";
    requestLogger.log("debug", msg);
    res.status(409).json({ msg });
  }

  // inserting user
  const inserted = await userDataService.insertUser(user);

  // todo: add logging
  return inserted
    ? res.status(201).json({ msg: "User registration success." })
    : res.status(409).json({ msg: "User registration failed." });
}
