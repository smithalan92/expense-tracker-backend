import { FastifyInstance } from 'fastify';
import CategoryRepository, { DBGetCategoriesResult } from '../../repository/CategoryRepository';
import CountryRepository__V2, { TripCountryWithCities } from '../../repository/CountryRepository__V2';
import CurrencyRepository__V2 from '../../repository/CurrencyRepository__V2';
import ExpenseRepository__V2 from '../../repository/ExpenseRepository__V2';
import TripRepository__V2 from '../../repository/TripRepository__V2';
import UserRepository__V2 from '../../repository/UserRepository__V2';
import { parseExpenseForResponse, ProcessedTripExpense } from '../../utils/expenseParser';
import { ParsedTrip, parseTrip } from '../../utils/trip';

class GetTripDataRoute {
  tripRepository: TripRepository__V2;
  countryRepository: CountryRepository__V2;
  userRepository: UserRepository__V2;
  currencyRepository: CurrencyRepository__V2;
  categoryRepository: CategoryRepository;
  expenseRepository: ExpenseRepository__V2;

  constructor({
    tripRepositoryV2,
    countryRepositoryV2,
    userRepositoryV2,
    currencyRepositoryV2,
    categoryRepository,
    expenseRepositoryV2,
  }: ContainerCradle) {
    this.tripRepository = tripRepositoryV2;
    this.countryRepository = countryRepositoryV2;
    this.userRepository = userRepositoryV2;
    this.currencyRepository = currencyRepositoryV2;
    this.categoryRepository = categoryRepository;
    this.expenseRepository = expenseRepositoryV2;
  }

  configure(server: FastifyInstance) {
    server.route<{
      Params: GetTripDataParams;
      Reply: PossibleErrorResponse<GetTripDataResponse>;
    }>({
      method: 'GET',
      url: '/v2/trip/:tripId',
      handler: async (req, reply) => {
        const userId: number = req.requestContext.get('userId')!;
        const tripId = req.params.tripId;

        const [trip] = await this.tripRepository.getTrips({ tripIds: [tripId], userId });

        if (!trip) {
          return reply.code(404).send();
        }

        const [countriesWithCities, userIds, currencyIds, categories, expenses] = await Promise.all([
          this.countryRepository.getSelectedCountriesAndCitiesForTrip(tripId),
          this.userRepository.getUserIdsForTrip(tripId),
          this.currencyRepository.getCurrencyIdsForTrip(tripId),
          this.categoryRepository.getCategories(),
          this.expenseRepository.findExpensesForTrip({ tripId }),
        ]);

        const parsedTrip = parseTrip(trip);
        const parsedExpenses = expenses.map(parseExpenseForResponse);

        return reply.send({
          trip: parsedTrip,
          countries: countriesWithCities,
          userIds: userIds,
          currencyIds,
          categories,
          expenses: parsedExpenses,
        });
      },
    });
  }
}

export default GetTripDataRoute;

interface GetTripDataParams {
  tripId: number;

  currencyIds: number[];
}

interface GetTripDataResponse {
  trip: ParsedTrip;
  countries: TripCountryWithCities[];
  userIds: number[];
  currencyIds: number[];
  categories: DBGetCategoriesResult[];
  expenses: ProcessedTripExpense[];
}
