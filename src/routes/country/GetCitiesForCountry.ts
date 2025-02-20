import { FastifyInstance } from 'fastify';
import CountryRepository, { DBCityResult } from '../../repository/CountryRepository';

class GetCitiesForCountry {
  countryRepository: CountryRepository;

  constructor({ countryRepository }: ContainerCradle) {
    this.countryRepository = countryRepository;
  }

  configure(server: FastifyInstance) {
    server.route<{
      Params: GetCitiesForCountryParams;
      Reply: PossibleErrorResponse<GetCitiesForCountryResponse>;
    }>({
      method: 'GET',
      url: '/v2/countries/:countryId/cities',
      handler: async (req, reply) => {
        const cities = await this.countryRepository.getCitiesForCountries([req.params.countryId]);

        return reply.code(200).send({ cities });
      },
    });
  }
}

export default GetCitiesForCountry;

interface GetCitiesForCountryParams {
  countryId: number;
}

interface GetCitiesForCountryResponse {
  cities: DBCityResult[];
}
