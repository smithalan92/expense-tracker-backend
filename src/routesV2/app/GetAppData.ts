import { FastifyInstance } from 'fastify';
import Server from '../../lib/Server';
import CountryRepository, { CountryWithCurrency } from '../../repository/CountryRepository';
import UserRepository from '../../repository/UserRepository';

class GetAppDataRoute {
  userRepository: UserRepository;
  countryRepository: CountryRepository;

  constructor({ userRepository, countryRepository }: GetAppDataRouteParams) {
    this.userRepository = userRepository;
    this.countryRepository = countryRepository;
  }

  configure(server: FastifyInstance) {
    server.route<{
      Reply: PossibleErrorResponse<GetAppDataResponse>;
    }>({
      method: 'GET',
      url: '/v2/app',
      handler: async () => {
        const [countries, users] = await Promise.all([
          this.countryRepository.getCountries__V2(),
          this.userRepository.getUsers(),
        ]);

        const response: GetAppDataResponse = {
          countries,
          users,
        };

        return response;
      },
    });
  }
}

export default GetAppDataRoute;

interface GetAppDataRouteParams {
  server: Server;
  userRepository: UserRepository;
  countryRepository: CountryRepository;
}

interface GetAppDataResponse {
  countries: CountryWithCurrency[];
  users: unknown[];
}
