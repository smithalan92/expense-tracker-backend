import { ContainerCradle } from '../lib/types';
import { PossibleErrorResponse, RouterHandlerWithParams } from '../types/routes';
import { GetCitiesForCountryParams, GetCitiesForCountryResponse } from './CountryController.types';
import CityRepository from '../repository/CityRepository';

class CountryController {
  cityRepository: CityRepository;

  constructor({ cityRepository }: ContainerCradle) {
    this.cityRepository = cityRepository;
  }

  getCitiesForCountry: RouterHandlerWithParams<GetCitiesForCountryParams, PossibleErrorResponse<GetCitiesForCountryResponse>> = async (
    req,
    reply
  ) => {
    const countryId: number = req.params.countryId;
    const cities = await this.cityRepository.getCitiesForCountry(countryId);

    return reply.send({ cities }).code(200);
  };
}

export default CountryController;
