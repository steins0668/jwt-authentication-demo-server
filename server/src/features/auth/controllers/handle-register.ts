import type { Request, Response } from "express";
import type { RegisterSchema } from "../schemas/register.schema";

export async function handleRegister(
  req: Request<{}, {}, RegisterSchema>,
  res: Response
) {
  const { body: user, requestLogger, userDataService } = req;

  const queryResult = await userDataService.tryGetUser({
    type: "user",
    user,
  });

  if (queryResult.success && queryResult.result) {
    //  query completed and there is a result
    const msg = "User already exists.";

    requestLogger.log("debug", msg);
    res.status(409).json({ msg });
    return;
  }
  if (!queryResult.success) {
    //  query interrupted
    const { message: logMsg } = queryResult.error;
    requestLogger.log("error", logMsg, queryResult.error);

    const resMsg = "Database error. Please try again later.";
    res.status(500).json({ msg: resMsg });
    return;
  }

  // inserting user
  requestLogger.log("debug", "Inserting new user...");
  const insertResult = await userDataService.tryAddUser(user);

  if (insertResult.success) {
    const msg = "User registration success.";

    requestLogger.log("debug", msg);
    res.status(201).json({ msg });
  } else {
    const { message: logMsg } = insertResult.error;
    requestLogger.log("error", logMsg, insertResult.error);

    const resMsg = "Database error. Please try again later.";
    res.status(500).json({ ms: resMsg });
  }

  return;
}
