import bcrypt from "bcrypt";
import { createContext } from "../../../db/createContext";
import {
  RoleRepository,
  UserRepository,
  type IUserFilter,
} from "./repositories";
import type { InsertModels, ViewModels } from "../types";
import { ResultBuilder } from "../../../utils";
import type { BaseResult } from "../../../types";
import { DbAccess } from "../../../error";
import { SignInSchema } from "../schemas";

type NewUser = InsertModels.User;

export async function createUserDataService() {
  const dbContext = await createContext();
  const roleRepoInstance = new RoleRepository(dbContext);
  const userRepoInstance = new UserRepository(dbContext);
  return new UserDataService(roleRepoInstance, userRepoInstance);
}

export class UserDataService {
  private readonly _roleRepository: RoleRepository;
  private readonly _userRepository: UserRepository;

  public constructor(
    roleRepository: RoleRepository,
    userRepository: UserRepository
  ) {
    this._roleRepository = roleRepository;
    this._userRepository = userRepository;
  }

  /**
   * @public
   * @async
   * @function tryAddUser
   * @description Asynchronously inserts a new user into the database through the
   * `UserRepository` with the `insertUser` method.
   * Hashes the `password` field first with `bcrypt` before inserting.
   * @param user - The `NewUser` entry to be inserted.
   * @returns A success object containing the `id` of the `NewUser` inserted, or a `fail` object
   * containing the error class if the insertion failed.
   *
   * !note that the password is not hashed yet when the `NewUser` object is being passed to this method.
   */
  public async tryAddUser(
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
   * @param options.signInMethod A `string` specifying whether the user is logging in through email or
   * username. Matches the `keys` of the {@link IUserFilter} type.
   * @param options.authDetails A {@link SignInSchema} object used for filtering the database query
   * during login operations.
   * @returns A `promise` resolving to a success result object containing {@link UserViewModel} if a `User`
   * is found, or `undefined` if no `User` is found. If the query operation fails, returns a fail result
   * object containing a message as well as the stack trace.
   */
  public async tryGetUser(
    options: TryGetUserOptions
  ): Promise<
    | BaseResult.Success<ViewModels.User | undefined>
    | BaseResult.Fail<DbAccess.ErrorClass>
  > {
    let userFilter: IUserFilter = {};

    try {
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
          const { signInMethod, authDetails } = options;
          userFilter[signInMethod] = authDetails.identifier;
          break;
        }
        case "userId": {
          userFilter.userId = options.userId;
          break;
        }
      }

      const user = await this._userRepository.getUser(userFilter);

      return ResultBuilder.success(user);
    } catch (err) {
      return ResultBuilder.fail(
        new DbAccess.ErrorClass({
          name: "DB_ACCESS_QUERY_ERROR",
          message: "Error querying the database. Please try again later.",
          cause: err,
        })
      );
    }
  }

  public async getUserRole(roleId: number): Promise<string | undefined> {
    const role = await this._roleRepository.getRole({
      searchBy: "id",
      id: roleId,
    });

    return role?.roleName;
  }
}
type TryGetUserOptions = WithUser | WithLogin | WithId;

type WithUser = {
  type: "user";
  user: NewUser;
};

type WithLogin = {
  type: "login";
  signInMethod: "email" | "username";
  authDetails: SignInSchema;
};

type WithId = {
  type: "userId";
  userId: number;
};
