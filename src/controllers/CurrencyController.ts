import { ContainerCradle } from '../lib/types';
import { PossibleErrorResponse, RouterHandlerWithParams } from '../types/routes';
import { GetCurrenciesResponse } from './CurrencyController.types';
import CurrencyRepository from '../repository/CurrencyRepository';

class CurrencyController {
  currencyRepository: CurrencyRepository;

  constructor({ currencyRepository }: ContainerCradle) {
    this.currencyRepository = currencyRepository;
  }

  getCurrencies: RouterHandlerWithParams<unknown, PossibleErrorResponse<GetCurrenciesResponse>> = async (req, reply) => {
    const currencies = await this.currencyRepository.getCurrencies();

    return reply.send({ currencies }).code(200);
  };
}

export default CurrencyController;
