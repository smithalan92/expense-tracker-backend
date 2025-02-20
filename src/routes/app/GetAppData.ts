import { FastifyInstance } from 'fastify';
import CountryRepository, { CountryWithCurrency } from '../../repository/CountryRepository';
import CurrencyRepository, { DBCurrency } from '../../repository/CurrencyRepository';
import UserRepository, { DBUserResult } from '../../repository/UserRepository';

class GetAppDataRoute {
  userRepository: UserRepository;
  countryRepository: CountryRepository;
  currencyRepository: CurrencyRepository;

  constructor({ userRepository, countryRepository, currencyRepository }: ContainerCradle) {
    this.userRepository = userRepository;
    this.countryRepository = countryRepository;
    this.currencyRepository = currencyRepository;
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
