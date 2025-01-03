import { FastifyInstance } from 'fastify';
import CountryRepository__V2, { CountryWithCurrency } from '../../repository/CountryRepository__V2';
import UserRepository__V2, { DBUserResult } from '../../repository/UserRepository__V2';

class GetAppDataRoute {
  userRepository: UserRepository__V2;
  countryRepository: CountryRepository__V2;

  constructor({ userRepositoryV2, countryRepositoryV2 }: ContainerCradle) {
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

export interface GetAppDataResponse {
  countries: CountryWithCurrency[];
  users: DBUserResult[];
}
