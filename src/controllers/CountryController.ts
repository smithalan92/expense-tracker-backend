import { ContainerCradle } from '../lib/types';
import { PossibleErrorResponse, RouteHandlerWithQueryString, RouterHandlerWithParams } from '../types/routes';
import { CitiesByCountryId, GetCitiesForCountriesParams, GetCitiesForCountriesResponse } from './CountryController.types';
import CityRepository from '../repository/CityRepository';

class CountryController {
  cityRepository: CityRepository;

  constructor({ cityRepository }: ContainerCradle) {
    this.cityRepository = cityRepository;
  }

  getCitiesForCountries: RouteHandlerWithQueryString<GetCitiesForCountriesParams, PossibleErrorResponse<GetCitiesForCountriesResponse>> = async (
    req,
    reply
  ) => {
    const countryIds: number[] = req.query.countryIds;
    const cities = await this.cityRepository.getCitiesForCountryIds(countryIds);

    const citiesByCountryId = cities.reduce<CitiesByCountryId>((acc, current) => {
      const { countryId } = current;

      if (acc[countryId]) {
        acc[countryId].push(current);
      } else {
        acc[countryId] = [current];
      }

      return acc;
    }, {});

    return reply.send({ countries: citiesByCountryId }).code(200);
  };
}

export default CountryController;
