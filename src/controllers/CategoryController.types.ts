import { DBGetCategoriesResult } from '../repository/CategoryRepository.types';

export interface GetCategoriesResponse {
  categories: DBGetCategoriesResult[];
}
