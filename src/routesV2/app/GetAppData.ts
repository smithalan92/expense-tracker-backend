import { FastifyInstance } from 'fastify';
import Server from '../../lib/Server';
import CountryRepository__V2, { CountryWithCurrency } from '../../repository/CountryRepository__V2';
import UserRepository__V2 from '../../repository/UserRepository__V2';

class GetAppDataRoute {
  userRepository: UserRepository__V2;
  countryRepository: CountryRepository__V2;

  constructor({ userRepositoryV2, countryRepositoryV2 }: GetAppDataRouteParams) {
    this.userRepository = userRepositoryV2;
    this.countryRepository = countryRepositoryV2;
  }

  configure(server: FastifyInstance) {
    server.route<{
      Reply: PossibleErrorResponse<GetAppDataResponse>;
    }>({
      method: 'GET',
      url: '/v2/app',
      handler: async () => {
        const [countries, users] = await Promise.all([
          this.countryRepository.getCountries(),
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
  userRepositoryV2: UserRepository__V2;
  countryRepositoryV2: CountryRepository__V2;
}

interface GetAppDataResponse {
  countries: CountryWithCurrency[];
  users: unknown[];
}
