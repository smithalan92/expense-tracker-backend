import { FastifyInstance } from 'fastify';
import CurrencyController from '../controllers/CurrencyController';
import { GetCurrenciesResponse } from '../controllers/CurrencyController.types';
import { Router, ContainerCradle } from '../lib/types';
import { PossibleErrorResponse } from '../types/routes';

class CurrencyRoutes implements Router {
  controller: CurrencyController;

  constructor({ currencyController }: ContainerCradle) {
    this.controller = currencyController;
  }

  configure(server: FastifyInstance) {
    server.route<{
      Params: unknown;
      Reply: PossibleErrorResponse<GetCurrenciesResponse>;
    }>({
      method: 'GET',
      url: '/currencies',
      handler: this.controller.getCurrencies,
    });
  }
}

export default CurrencyRoutes;
