import { PossibleErrorResponse, RouteHandler } from '../types/routes';
import { ContainerCradle } from '../lib/types';
import CountryRepository from '../repository/CountryRepository';
import { GetCountriesResponse } from './CountryController.types';

class CountryController {
  countryRepository: CountryRepository;

  constructor({ countryRepository }: ContainerCradle) {
    this.countryRepository = countryRepository;
  }

  getCountries: RouteHandler<PossibleErrorResponse<GetCountriesResponse>> = async (_, reply) => {
    const countries = await this.countryRepository.getCountries();

    return reply.code(200).send({ countries });
  };
}

export default CountryController;
