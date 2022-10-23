import { ContainerCradle } from '../lib/types';
import { PossibleErrorResponse, RouteHandler } from '../types/routes';
import { GetCategoriesResponse } from './CategoryController.types';
import CategoryRepository from '../repository/CategoryRepository';

class CategoryController {
  categoryRepository: CategoryRepository;

  constructor({ categoryRepository }: ContainerCradle) {
    this.categoryRepository = categoryRepository;
  }

  getCategories: RouteHandler<PossibleErrorResponse<GetCategoriesResponse>> = async (req, reply) => {
    const categories = await this.categoryRepository.getCategories();

    return reply
      .send({
        categories,
      })
      .code(200);
  };
}

export default CategoryController;
