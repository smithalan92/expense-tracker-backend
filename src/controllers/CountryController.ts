import { ContainerCradle } from '../lib/types';
import CityRepository from '../repository/CityRepository';
import CountryRepository from '../repository/CountryRepository';
import { PossibleErrorResponse, RouteHandler, RouterHandlerWithParams } from '../types/routes';
import { GetCitiesForCountryParams, GetCitiesForCountryResponse, GetCountriesResponse } from './CountryController.types';

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
