import { FastifyInstance } from 'fastify';
import CountryRepository__V2, { CountryWithCurrency } from '../../repository/CountryRepository__V2';
import CurrencyRepository__V2, { DBCurrency } from '../../repository/CurrencyRepository__V2';
import UserRepository__V2, { DBUserResult } from '../../repository/UserRepository__V2';

class GetAppDataRoute {
  userRepository: UserRepository__V2;
  countryRepository: CountryRepository__V2;
  currencyRepository: CurrencyRepository__V2;

  constructor({ userRepositoryV2, countryRepositoryV2, currencyRepositoryV2 }: ContainerCradle) {
    this.userRepository = userRepositoryV2;
    this.countryRepository = countryRepositoryV2;
    this.currencyRepository = currencyRepositoryV2;
  }

  configure(server: FastifyInstance) {
    server.route<{
      Reply: PossibleErrorResponse<GetAppDataResponse>;
    }>({
      method: 'GET',
      url: '/v2/app',
      handler: async () => {
        const [countries, users, currencies] = await Promise.all([
          this.countryRepository.getCountries(),
          this.userRepository.getUsers(),
          this.currencyRepository.getCurrencies(),
        ]);

        const response: GetAppDataResponse = {
          countries,
          users,
          currencies,
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
  currencies: DBCurrency[];
}
