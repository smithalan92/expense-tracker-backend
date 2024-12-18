import { type FastifyInstance } from 'fastify';
import type DBAgent from '../lib/DBAgent';
import type CategoryRepository from '../repository/CategoryRepository';
import { type DBGetCategoriesResult } from '../repository/CategoryRepository';
import type CityRepository from '../repository/CityRepository';
import { type DBCityResult, type DBGetCityOptionsForTripIdResult } from '../repository/CityRepository';
import type CountryRepository from '../repository/CountryRepository';
import { type DBGetCountriesByTripIDResult } from '../repository/CountryRepository';
import type CurrencyRepository from '../repository/CurrencyRepository';
import { type DBGetCurrenciesResult } from '../repository/CurrencyRepository';
import type ExpenseRepository from '../repository/ExpenseRepository';
import {
  type DBExpenseByUserBreakdownForTripResult,
  type DBExpenseCategoryBreakdownForTripResult,
  type DBGetCityBreakdownResult,
  type DBGetCountryBreakdownResult,
  type DBGetDailyCostBreakdownResult,
  type DBGetExpensiveTripDayResult,
  type ExpenseCategoryBreakdownForTripByUser,
  type NewExpenseRecord,
  type ParsedHourlyExpenseResult,
  type UpdateExpenseParams,
} from '../repository/ExpenseRepository';
import type FileRepository from '../repository/FileRepository';
import type TripRepository from '../repository/TripRepository';
import { type UsersForTrip } from '../repository/TripRepository';
import { parseExpenseForResponse, type ProcessedTripExpense } from '../utils/expenseParser';
import { getTripFileUrl } from '../utils/file';
import { parseTrip } from '../utils/trip';

class TripRoutes implements Router {
  tripRepository: TripRepository;
  expenseRepository: ExpenseRepository;
  countryRepository: CountryRepository;
  currencyRepository: CurrencyRepository;
  cityRepository: CityRepository;
  categoryRepository: CategoryRepository;
  fileRepository: FileRepository;
  env: Env;
  dbAgent: DBAgent;

  constructor({
    fileRepository,
    env,
    tripRepository,
    expenseRepository,
    countryRepository,
    currencyRepository,
    cityRepository,
    categoryRepository,
    dbAgent,
  }: ContainerCradle) {
    this.tripRepository = tripRepository;
    this.expenseRepository = expenseRepository;
    this.countryRepository = countryRepository;
    this.currencyRepository = currencyRepository;
    this.cityRepository = cityRepository;
    this.categoryRepository = categoryRepository;
    this.fileRepository = fileRepository;
    this.env = env;
    this.dbAgent = dbAgent;
  }

  configure(server: FastifyInstance) {
    this.makeGetTripsRoute(server);
    this.makeGetExpensesForTripRoute(server);
    this.makeGetTripDataRoute(server);
    this.makeGetTripEditDataRoute(server);
    this.makeGetTripStatsRoute(server);
    this.makeAddExpenseRoute(server);
    this.makeDeleteExpenseRoute(server);
    this.makeUpdateExpenseRoute(server);
    this.makeAddTripRoute(server);
    this.makeEditTripRoute(server);
    this.makeDeleteTripRoute(server);
  }

  makeGetTripsRoute(server: FastifyInstance) {
    server.route<{
      Reply: PossibleErrorResponse<GetTripReponse>;
    }>({
      method: 'GET',
      url: '/trips',
      handler: async (req, reply) => {
        const userId: number = req.requestContext.get('userId')!;

        const trips = await this.tripRepository.findTripsForUserId(userId);

        const countriesIdsForTrips = trips.map((trip) => trip.id);

        const countries = await this.countryRepository.getCountriesForTrips(countriesIdsForTrips);

        const tripsWithFormattedDates = trips
          .map<ResponseTrip>((t) => {
            return {
              ...parseTrip(t),
              countries: countries.filter((c) => c.tripId === t.id),
            };
          })
          .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());

        return reply.send({ trips: tripsWithFormattedDates }).code(200);
      },
    });
  }

  makeGetExpensesForTripRoute(server: FastifyInstance) {
    server.route<{
      Params: RouteWithTripIDParams;
      Reply: PossibleErrorResponse<GetExpensesForTripReponse>;
    }>({
      method: 'GET',
      url: '/trips/:tripId/expenses',
      handler: async (req, reply) => {
        const userId = req.requestContext.get('userId')!;
        const tripId = req.params.tripId;

        const trip = await this.tripRepository.findTripById({ userId, tripId });

        if (!trip) {
          return reply.code(400).send({ error: 'Trip not found' });
        }

        const expenses = await this.expenseRepository.findExpensesForTrip(tripId);

        const processedExpenses = expenses.map<ProcessedTripExpense>(parseExpenseForResponse);

        return reply.send({ expenses: processedExpenses }).code(200);
      },
    });
  }

  makeGetTripDataRoute(server: FastifyInstance) {
    server.route<{
      Params: RouteWithTripIDParams;
      Reply: PossibleErrorResponse<GetTripDataResponse>;
    }>({
      method: 'GET',
      url: '/trips/:tripId/data',
      handler: async (req, reply) => {
        const userId = req.requestContext.get('userId')!;
        const tripId: number = req.params.tripId;

        const trip = await this.tripRepository.findTripById({ userId, tripId });

        if (!trip) {
          return reply.code(400).send({ error: 'Trip not found' });
        }

        const [expenses, cities, countries, currencies, categories, users] = await Promise.all([
          this.expenseRepository.findExpensesForTrip(tripId),
          this.cityRepository.getCityOptionsForTripId(tripId),
          this.countryRepository.getCountriesForTrips([tripId]),
          this.currencyRepository.getCurrencies(),
          this.categoryRepository.getCategories(),
          this.tripRepository.findUsersForTrip(tripId),
        ]);

        const processedExpenses = expenses.map<ProcessedTripExpense>(parseExpenseForResponse);

        return reply.code(200).send({
          trip: parseTrip(trip),
          expenses: processedExpenses,
          cities,
          countries,
          currencies,
          categories,
          users,
        });
      },
    });
  }

  makeGetTripEditDataRoute(server: FastifyInstance) {
    server.route<{
      Params: RouteWithTripIDParams;
      Reply: PossibleErrorResponse<GetTripDataForEditingResponse>;
    }>({
      method: 'GET',
      url: '/trips/:tripId/edit-data',
      handler: async (req, reply) => {
        const userId: number = req.requestContext.get('userId')!;
        const tripId: number = req.params.tripId;

        const trip = await this.tripRepository.findTripById({ userId, tripId });

        if (!trip) {
          return reply.code(400).send({ error: 'Trip not found' });
        }

        const [countries, users] = await Promise.all([
          this.countryRepository.getCountriesForTrips([trip.id]),
          this.tripRepository.findUsersForTrip(tripId),
        ]);

        const userIds = Object.keys(users).map(Number);

        const cityIds = countries.reduce<number[]>((acc, current) => {
          if (current.cityIds) {
            return [...acc, ...current.cityIds.split(',').map(Number)];
          }
          return acc;
        }, []);

        let cities: DBCityResult[] = [];

        if (cityIds.length) {
          cities = await this.cityRepository.getCitiesById(cityIds);
        }

        const countriesWithCities = countries.reduce<CountryWithCities[]>((acc, current) => {
          const data: CountryWithCities = { countryId: current.id, name: current.name };

          const countryCityIds = cities.filter((c) => c.countryId === data.countryId).map((c) => c.id);

          if (countryCityIds) {
            data.cityIds = countryCityIds;
          }

          return [...acc, data];
        }, []);

        return reply
          .send({
            name: trip.name,
            image: trip.filePath ? getTripFileUrl(trip.filePath) : null,
            startDate: trip.startDate,
            endDate: trip.endDate,
            countries: countriesWithCities,
            userIds,
          })
          .code(200);
      },
    });
  }

  makeGetTripStatsRoute(server: FastifyInstance) {
    server.route<{
      Params: RouteWithTripIDParams;
      Querystring: GetExpenseStatsQuery;
      Reply: PossibleErrorResponse<GetExpenseStatsResponse>;
    }>({
      method: 'GET',
      url: '/trips/:tripId/stats',
      handler: async (req, reply) => {
        const userId = req.requestContext.get('userId')!;
        const tripId = req.params.tripId;
        const { includeFlights, includeHotels } = req.query;

        const trip = await this.tripRepository.findTripById({ userId, tripId });

        if (!trip) {
          return reply.code(400).send({ error: 'Trip not found' });
        }

        const {
          categoryBreakdown,
          categoryByUserBreakdown,
          userBreakdown,
          mostExpenseDay,
          leastExpensiveDay,
          countryBreakdown,
          cityBreakdown,
          dailyCostBreakdown,
          hourlySpendingBreakdown,
        } = await this.expenseRepository.getTripExpenseStats(
          { tripId },
          { includeFlights: includeFlights === 'true', includeHotels: includeHotels === 'true' },
        );

        return reply.status(200).send({
          categoryBreakdown,
          categoryByUserBreakdown,
          userBreakdown,
          mostExpenseDay,
          leastExpensiveDay,
          countryBreakdown,
          cityBreakdown,
          dailyCostBreakdown,
          hourlySpendingBreakdown,
        });
      },
    });
  }

  makeAddExpenseRoute(server: FastifyInstance) {
    server.route<{
      Params: AddExpenseForTripParams;
      Body: AddExpenseForTripBody;
      Reply: PossibleErrorResponse;
    }>({
      method: 'POST',
      url: '/trips/:tripId/expense',
      handler: async (req, reply) => {
        const { tripId } = req.params;
        const userId = req.requestContext.get('userId')!;
        const trip = await this.tripRepository.findTripById({ userId, tripId });

        if (!trip) {
          return reply.code(400).send({ error: 'Trip not found' });
        }

        const { localDateTime, cityId, amount, currencyId, categoryId, description, userId: expenseUserId, userIds: expenseUserIds } = req.body;

        const currencyToEurFXRate = await this.currencyRepository.getCurrencyFXRate(currencyId);

        let expenseAmount;

        if (expenseUserIds?.length) {
          expenseAmount = Math.round((amount / expenseUserIds.length) * 100) / 100;
        } else {
          expenseAmount = amount;
        }

        const euroAmount = parseFloat((expenseAmount / currencyToEurFXRate).toFixed(2));

        const userIdsToAddExpensesFor = expenseUserIds ?? [expenseUserId!];

        for (const userIdToAddExpenseFor of userIdsToAddExpensesFor) {
          const expense: NewExpenseRecord = {
            tripId,
            amount: expenseAmount,
            currencyId,
            euroAmount,
            localDateTime,
            description,
            categoryId,
            cityId,
            userId: userIdToAddExpenseFor,
            createdByUserId: userId,
          };

          await this.expenseRepository.addExpenseForTrip(expense);
        }

        return reply.status(201).send();
      },
    });
  }

  makeDeleteExpenseRoute(server: FastifyInstance) {
    server.route<{
      Params: DeleteExpenseParams;
      Reply: PossibleErrorResponse<any>;
    }>({
      method: 'DELETE',
      url: '/trips/:tripId/expense/:expenseId',
      handler: async (req, reply) => {
        const userId = req.requestContext.get('userId')!;
        const tripId = req.params.tripId;
        const expenseId = req.params.expenseId;

        const trip = await this.tripRepository.findTripById({ userId, tripId });

        if (!trip) {
          return reply.code(400).send({ error: 'Trip not found' });
        }

        await this.expenseRepository.deleteExpenseForTrip(tripId, expenseId);

        return reply.status(204).send();
      },
    });
  }

  makeUpdateExpenseRoute(server: FastifyInstance) {
    server.route<{
      Params: EditExpenseForTripParams;
      Body: UpdateExpenseForTripBody;
      Reply: PossibleErrorResponse;
    }>({
      method: 'PATCH',
      url: '/trips/:tripId/expense/:expenseId',
      handler: async (req, reply) => {
        const { tripId, expenseId } = req.params;
        const userId = req.requestContext.get('userId')!;
        const updateData = req.body;

        const expense = await this.expenseRepository.getExpense(expenseId, userId);

        if (!expense) {
          return reply.code(404).send({ error: 'Trip or expense not found' });
        }

        const hasValidUpdateData = !!Object.values(updateData).find((v) => v !== null && v !== undefined);

        if (!hasValidUpdateData) {
          return reply.code(400).send({ error: 'Not valid update data provided' });
        }

        if ((updateData.amount && updateData.amount !== expense.amount) ?? (updateData.currencyId && updateData.currencyId !== expense.currencyId)) {
          const amount = updateData.amount ?? expense.amount;
          const currencyId = updateData.currencyId ?? expense.currencyId;
          const currencyToEurFXRate = await this.currencyRepository.getCurrencyFXRate(currencyId);
          updateData.euroAmount = parseFloat((amount / currencyToEurFXRate).toFixed(2));
        }

        await this.expenseRepository.updateExpenseForTrip(tripId, expenseId, userId, updateData);

        return reply.status(200).send();
      },
    });
  }

  makeAddTripRoute(server: FastifyInstance) {
    server.route<{
      Body: CreateTripBody;
      Reply: PossibleErrorResponse<CreateTripResponse>;
    }>({
      method: 'POST',
      url: '/trips',
      handler: async (req, reply) => {
        const userId = req.requestContext.get('userId')!;

        const { name, startDate, endDate, file, countries, userIds } = req.body;

        if (!userIds.includes(userId)) {
          // Always make sure the current user is a member of the trip
          userIds.push(userId);
        }

        const transaction = await this.dbAgent.createTransaction();

        try {
          const tripId = await this.tripRepository.createTrip({ name, startDate, endDate, countries, userIds }, transaction);

          if (file) {
            const fileId = await this.fileRepository.saveTempFile(
              {
                userId,
                fileName: file,
                destPath: `/trips/${tripId}`,
              },
              transaction,
            );

            await this.tripRepository.updateTrip({ fileId, tripId, currentUserId: userId }, transaction);
          }

          await transaction.commit();

          const [trip] = await this.tripRepository.findTripsForUserId(userId, tripId);

          return reply.code(201).send({ trip: parseTrip(trip) });
        } catch (err) {
          await transaction.rollback();
          throw err;
        }
      },
    });
  }

  makeEditTripRoute(server: FastifyInstance) {
    server.route<{
      Params: RouteWithTripIDParams;
      Body: UpdateTripBody;
      Reply: PossibleErrorResponse<UpdateTripResponse>;
    }>({
      method: 'PATCH',
      url: '/trips/:tripId',
      handler: async (req, reply) => {
        const userId = req.requestContext.get('userId')!;
        const tripId = req.params.tripId;

        const existingTrip = await this.tripRepository.findTripById({ userId, tripId });

        if (!existingTrip) {
          return reply.code(400).send({ error: 'Trip not found' });
        }

        const transaction = await this.dbAgent.createTransaction();

        let fileId: null | number = null;

        try {
          if (req.body.file) {
            fileId = await this.fileRepository.saveTempFile(
              {
                userId,
                fileName: req.body.file,
                destPath: `/trips/${tripId}`,
              },
              transaction,
            );

            await this.tripRepository.updateTrip({ fileId, tripId, currentUserId: userId }, transaction);
          }

          await this.tripRepository.updateTrip({
            tripId,
            name: req.body.name,
            startDate: req.body.startDate,
            endDate: req.body.endDate,
            countries: req.body.countries,
            userIds: req.body.userIds,
            currentUserId: userId,
          });

          await transaction.commit();

          const [trip] = await this.tripRepository.findTripsForUserId(userId, tripId);

          return reply.code(201).send({ trip: parseTrip(trip) });
        } catch (err) {
          await transaction.rollback();
          throw err;
        }
      },
    });
  }

  makeDeleteTripRoute(server: FastifyInstance) {
    server.route<{
      Params: DeleteTripParams;
      Reply: PossibleErrorResponse;
    }>({
      method: 'DELETE',
      url: '/trips/:tripId',
      handler: async (req, reply) => {
        const { tripId } = req.params;
        const userId = req.requestContext.get('userId')!;
        const trip = await this.tripRepository.findTripById({ userId, tripId });

        if (!trip) {
          return reply.code(404).send({ error: 'Trip not found' });
        }

        await this.tripRepository.updateTrip({
          tripId,
          status: 'deleted',
          currentUserId: userId,
        });

        return reply.code(204).send();
      },
    });
  }
}

export default TripRoutes;

export interface ParsedTrip {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'deleted';
  image: string;
  totalLocalAmount: number;
  totalExpenseAmount: number;
}

export interface ResponseTrip extends ParsedTrip {
  countries: DBGetCountriesByTripIDResult[];
}

export interface GetTripReponse {
  trips: ResponseTrip[];
}

export interface RouteWithTripIDParams {
  tripId: number;
}

export interface GetExpensesForTripReponse {
  expenses: ProcessedTripExpense[];
}

export interface AddExpenseForTripParams {
  tripId: number;
}

export interface AddExpenseForTripBody {
  localDateTime: string;
  cityId: number;
  amount: number;
  currencyId: number;
  categoryId: number;
  description: string;
  userId?: number;
  userIds?: number[];
}

export interface GetTripDataResponse {
  expenses: ProcessedTripExpense[];
  trip: ParsedTrip;
  countries: DBGetCountriesByTripIDResult[];
  cities: DBGetCityOptionsForTripIdResult[];
  currencies: DBGetCurrenciesResult[];
  categories: DBGetCategoriesResult[];
  users: UsersForTrip;
}

export interface GetExpenseStatsResponse {
  categoryBreakdown: DBExpenseCategoryBreakdownForTripResult[];
  categoryByUserBreakdown: ExpenseCategoryBreakdownForTripByUser;
  userBreakdown: DBExpenseByUserBreakdownForTripResult[];
  mostExpenseDay: DBGetExpensiveTripDayResult;
  leastExpensiveDay: DBGetExpensiveTripDayResult;
  countryBreakdown: DBGetCountryBreakdownResult[];
  cityBreakdown: DBGetCityBreakdownResult[];
  dailyCostBreakdown: DBGetDailyCostBreakdownResult[];
  hourlySpendingBreakdown: ParsedHourlyExpenseResult[];
}

export interface DeleteExpenseParams {
  tripId: number;
  expenseId: number;
}

export interface EditExpenseForTripParams {
  tripId: number;
  expenseId: number;
}

export type UpdateExpenseForTripBody = UpdateExpenseParams;

export interface CreateTripCountry {
  countryId: number;
  cityIds?: number[];
}

export interface CreateTripBody {
  name: string;
  startDate: string;
  endDate: string;
  file?: string;
  countries: CreateTripCountry[];
  userIds: number[];
}

export interface CreateTripResponse {
  trip: ParsedTrip;
}

export type UpdateTripBody = Partial<CreateTripBody>;

export type UpdateTripResponse = CreateTripResponse;

export interface DeleteTripParams {
  tripId: number;
}

export interface CountryWithCities {
  name: string;
  countryId: number;
  cityIds?: number[];
}

export interface GetTripDataForEditingResponse {
  image: string | null;
  name: string;
  startDate: string;
  endDate: string;
  countries: CountryWithCities[];
  userIds: number[];
}

export interface GetExpenseStatsQuery {
  includeFlights: string;
  includeHotels: string;
}
