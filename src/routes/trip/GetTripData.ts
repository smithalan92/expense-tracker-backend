import { FastifyInstance } from 'fastify';
import CategoryRepository, { DBGetCategoriesResult } from '../../repository/CategoryRepository';
import CountryRepository, { TripCountryWithCities } from '../../repository/CountryRepository';
import CurrencyRepository from '../../repository/CurrencyRepository';
import ExpenseRepository from '../../repository/ExpenseRepository';
import TripRepository from '../../repository/TripRepository';
import UserRepository from '../../repository/UserRepository';
import { parseExpenseForResponse, ProcessedTripExpense } from '../../utils/expenseParser';
import { ParsedTrip, parseTrip } from '../../utils/trip';

class GetTripDataRoute {
  tripRepository: TripRepository;
  countryRepository: CountryRepository;
  userRepository: UserRepository;
  currencyRepository: CurrencyRepository;
  categoryRepository: CategoryRepository;
  expenseRepository: ExpenseRepository;

  constructor({
    tripRepository,
    countryRepository,
    userRepository,
    currencyRepository,
    categoryRepository,
    expenseRepository,
  }: ContainerCradle) {
    this.tripRepository = tripRepository;
    this.countryRepository = countryRepository;
    this.userRepository = userRepository;
    this.currencyRepository = currencyRepository;
    this.categoryRepository = categoryRepository;
    this.expenseRepository = expenseRepository;
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
