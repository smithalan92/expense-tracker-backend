import { type ContainerCradle } from '../lib/types';
import type CityRepository from '../repository/CityRepository';
import type CountryRepository from '../repository/CountryRepository';
import { type PossibleErrorResponse, type RouteHandler, type RouterHandlerWithParams } from '../types/routes';
import { type GetCitiesForCountryParams, type GetCitiesForCountryResponse, type GetCountriesResponse } from './CountryController.types';

class CountryController {
  countryRepository: CountryRepository;
  cityRepository: CityRepository;

  constructor({ countryRepository, cityRepository }: ContainerCradle) {
    this.countryRepository = countryRepository;
    this.cityRepository = cityRepository;
  }

  getCountries: RouteHandler<PossibleErrorResponse<GetCountriesResponse>> = async (req, reply) => {
    const countries = await this.countryRepository.getCountries();

    return reply.code(200).send({ countries });
  };

  getCitiesForCountry: RouterHandlerWithParams<GetCitiesForCountryParams, PossibleErrorResponse<GetCitiesForCountryResponse>> = async (
    req,
    reply
  ) => {
    const cities = await this.cityRepository.getCitiesForCountryIds([req.params.countryId]);

    return reply.code(200).send({ cities });
  };
}

export default CountryController;
