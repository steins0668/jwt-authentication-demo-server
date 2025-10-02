import type { Request, Response } from "express";
import type { RegisterSchema } from "../schemas/register.schema";

export async function handleRegister(
  req: Request<{}, {}, RegisterSchema>,
  res: Response
) {
  const { body: user, requestLogger, userDataService } = req;

  //  * query user
  const userQuery = await userDataService.tryGetUser({
    type: "user",
    user,
  });

  if (userQuery.success && userQuery.result) {
    //  ! query completed and there is a result
    const message = "User already exists.";

    requestLogger.log("debug", message);
    res.status(409).json({ success: false, message });
    return;
  }
  if (!userQuery.success) {
    //  ! query interrupted
    const { message: logMsg } = userQuery.error;
    requestLogger.log("error", logMsg, userQuery.error);

    const resMsg = "Error adding user. Please try again later.";
    res.status(500).json({ success: false, message: resMsg });
    return;
  }

  // * inserting user
  requestLogger.log("debug", "Inserting new user...");
  const addUser = await userDataService.tryAddUser(user);

  if (addUser.success) {
    //  * success register
    const message = "User registration success.";

    requestLogger.log("debug", message);
    res.status(201).json({ success: true, message });
  } else {
    //  ! fail register
    const { message: logMsg } = addUser.error;
    requestLogger.log("error", logMsg, addUser.error);

    const resMsg = "Database error. Please try again later.";
    res.status(500).json({ success: true, message: resMsg });
  }

  return;
}
