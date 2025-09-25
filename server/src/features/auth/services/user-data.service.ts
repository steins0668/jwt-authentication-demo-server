import bcrypt from "bcrypt";
import type { InsertModels, ViewModels } from "../types";
import type { IUserFilter, UserRepository } from "./repositories";

type NewUser = InsertModels.User;

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
   * @returns The `id` of the `NewUser` inserted, or `undefined` if the insertion failed.
   *
   * !note that the password is not hashed yet when the `NewUser` object is being passed to this method.
   */
  public async insertUser(user: NewUser): Promise<number | undefined> {
    user.passwordHash = await bcrypt.hash(user.passwordHash, 10);
    const insertedId = await this._userRepository.insertUser(user);
    return insertedId;
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
