import { DBUserResult } from '../repository/UserRepository.types';

export interface GetUsersResponse {
  users: DBUserResult[];
}
