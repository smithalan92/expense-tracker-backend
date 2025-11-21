import { FastifyInstance } from 'fastify';
import CategoryRepository from '../../repository/CategoryRepository';
import CountryRepository from '../../repository/CountryRepository';
import CurrencyRepository from '../../repository/CurrencyRepository';
import ExpenseRepository, { type DBTotalExpensesForTripByUserResult } from '../../repository/ExpenseRepository';
import TripRepository from '../../repository/TripRepository';
import UserRepository from '../../repository/UserRepository';

class GetTripStatsRoute {
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
      Params: GetTripStatsParams;
      Reply: PossibleErrorResponse<GetTripDataResponse>;
    }>({
      method: 'GET',
      url: '/v2/trip/:tripId/stats',
      handler: async (req, reply) => {
        const userId: number = req.requestContext.get('userId')!;
        const tripId = req.params.tripId;

        const [trip] = await this.tripRepository.getTrips({ tripIds: [tripId], userId });

        if (!trip) {
          return reply.code(404).send();
        }

        const [totalExpensesByUser, catgoryExpensesByUser] = await Promise.all([
          this.expenseRepository.getTotalExpenesForTripByUsers(tripId),
          this.expenseRepository.getTotalExpenesByCategoryAndUserForTrip(tripId),
        ]);

        const catgeoryExpensesByUserParsed = catgoryExpensesByUser.reduce<CategoryExpensesForUser>((acc, current) => {
          if (!acc[current.userId]) {
            acc[current.userId] = {};
          }

          acc[current.userId][current.categoryId] = {
            userFirstName: current.firstName,
            userLastName: current.lastName,
            totalEuroAmount: current.totalEuroAmount,
          };

          return acc;
        }, {});

        return reply.send({
          totalExpensesByUser,
          categoryExpensesByUser: catgeoryExpensesByUserParsed,
        });
      },
    });
  }
}

export default GetTripStatsRoute;

interface GetTripStatsParams {
  tripId: number;
}

interface GetTripDataResponse {
  totalExpensesByUser: DBTotalExpensesForTripByUserResult[];
  categoryExpensesByUser: CategoryExpensesForUser;
}

type CategoryExpensesForUser = Record<string, Record<string, CatgeoryExpense>>;

interface CatgeoryExpense {
  userFirstName: string | null;
  userLastName: string | null;
  totalEuroAmount: number;
}
