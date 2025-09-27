import bcrypt from "bcrypt";
import { createContext } from "../../../db/createContext";
import { UserRepository, type IUserFilter } from "./repositories";
import type { InsertModels, ViewModels } from "../types";
import { ResultBuilder } from "../../../utils";
import { Register } from "../error";
import type { BaseResult } from "../../../types";
import { DbAccess } from "../../../error";

type NewUser = InsertModels.User;

export async function createUserDataService() {
  const dbContext = await createContext();
  const userRepoInstance = new UserRepository(dbContext);
  return new UserDataService(userRepoInstance);
}

export class UserDataService {
  private readonly _userRepository: UserRepository;

  public constructor(userRepository: UserRepository) {
    this._userRepository = userRepository;
  }

  /**
   * @public
   * @async
   * @function insertUser
   * @description Asynchronously inserts a new user into the database through the
   * `UserRepository` with the `insertUser` method.
   * Hashes the `password` field first with `bcrypt` before inserting.
   * @param user - The `NewUser` entry to be inserted.
   * @returns A success object containing the `id` of the `NewUser` inserted, or a `fail` object
   * containing the error class if the insertion failed.
   *
   * !note that the password is not hashed yet when the `NewUser` object is being passed to this method.
   */
  public async insertUser(
    user: NewUser
  ): Promise<
    | BaseResult.Success<number, "DB_INSERT">
    | BaseResult.Fail<DbAccess.ErrorClass>
  > {
    const getInsertErr = (err?: unknown) => {
      return new DbAccess.ErrorClass({
        name: "DB_ACCESS_INSERT_ERROR",
        message:
          "An error occured during database insertion on the `users` table. Please try again later.",
        cause: err,
      });
    };

    user.passwordHash = await bcrypt.hash(user.passwordHash, 10);

    try {
      const insertedId = await this._userRepository.insertUser(user);

      if (insertedId === undefined) throw getInsertErr();

      return ResultBuilder.success(insertedId, "DB_INSERT");
    } catch (err) {
      const error = err instanceof DbAccess.ErrorClass ? err : getInsertErr();
      return ResultBuilder.fail(error);
    }
  }

  /**
   * @public
   * @async
   * @function tryGetUser
   * @description Asynchronously attempts to retrieve a `User` from the database filtered using fields
   * provided by either a {@link NewUser}, a {@link LoginOptions} object.
   * @param options.user A {@link NewUser} object used for filtering the database query
   * during register operations.
   * @param options.login A {@link LoginOptions} object used for filtering the databse query
   * during login operations.
   * @returns A `promise` resolving to a {@link UserViewModel} if a `User` is found, or
   * `undefined` if no `User` is found.
   */
  public async tryGetUser(
    options: TryGetUserOptions
  ): Promise<ViewModels.User | undefined> {
    let userFilter: IUserFilter = {};

    switch (options.type) {
      case "user": {
        const { email, username } = options.user;

        userFilter = {
          filterType: "or",
          email,
          username,
        };
        break;
      }
      case "login": {
        //  todo: add login case
        break;
      }
    }

    const user = await this._userRepository.getUser(userFilter);

    return user;
  }
}
type TryGetUserOptions = WithUser | WithLogin;

type WithUser = {
  type: "user";
  user: NewUser;
};

//todo: add login options type
type WithLogin = {
  type: "login";
};
