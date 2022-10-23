import { FastifyInstance } from 'fastify';
import CategoryController from '../controllers/CategoryController';
import { GetCategoriesResponse } from '../controllers/CategoryController.types';
import { Router, ContainerCradle } from '../lib/types';
import { PossibleErrorResponse } from '../types/routes';

class CategoryRoutes implements Router {
  controller: CategoryController;

  constructor({ categoryController }: ContainerCradle) {
    this.controller = categoryController;
  }

  configure(server: FastifyInstance) {
    server.route<{
      Params: unknown;
      Reply: PossibleErrorResponse<GetCategoriesResponse>;
    }>({
      method: 'GET',
      url: '/expense-categories',
      handler: this.controller.getCategories,
    });
  }
}

export default CategoryRoutes;
