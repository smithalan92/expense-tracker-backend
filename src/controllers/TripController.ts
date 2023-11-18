import type DBAgent from '../lib/DBAgent';
import { type ContainerCradle, type Env } from '../lib/types';
import type CategoryRepository from '../repository/CategoryRepository';
import type CityRepository from '../repository/CityRepository';
import { type DBCityResult } from '../repository/CityRepository.types';
import type CountryRepository from '../repository/CountryRepository';
import type CurrencyRepository from '../repository/CurrencyRepository';
import type ExpenseRepository from '../repository/ExpenseRepository';
import { type NewExpenseRecord } from '../repository/ExpenseRepository.types';
import type FileRepository from '../repository/FileRepository';
import type TripRepository from '../repository/TripRepository';
import { type PossibleErrorResponse, type RouteHandler, type RouteHandlerWithBody, type RouteHandlerWithBodyAndParams, type RouterHandlerWithParams } from '../types/routes';
import { parseExpenseForResponse } from '../utils/expenseParser';
import { type ProcessedTripExpense } from '../utils/expenseParser.types';
import { getTripFileUrl } from '../utils/file';
import { parseTrip } from '../utils/trip';
import {
  type AddExpenseForTripBody,
  type AddExpenseForTripParams,
  type CountryWithCities,
  type CreateTripBody,
  type CreateTripResponse,
  type DeleteExpenseParams,
  type DeleteTripParams,
  type EditExpenseForTripParams,
  type GetExpenseStatsResponse,
  type GetExpensesForTripReponse,
  type GetTripDataForEditingResponse,
  type GetTripDataResponse,
  type GetTripReponse,
  type ResponseTrip,
  type RouteWithTripIDParams,
  type UpdateExpenseForTripBody,
  type UpdateTripBody,
  type UpdateTripResponse,
} from './TripController.types';

class TripController {
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

  getTrips: RouteHandler<PossibleErrorResponse<GetTripReponse>> = async (req, reply) => {
    const userId: number = req.requestContext.get('userId')!;

    const trips = await this.tripRepository.findTripsForUserId(userId);

    const countriesIdsForTrips = trips.map((trip) => trip.id);

    const countries = await this.countryRepository.getCountriesForTrips(countriesIdsForTrips);

    const tripsWithFormattedDates = trips.map<ResponseTrip>((t) => {
      return {
        ...parseTrip(t),
        countries: countries.filter((c) => c.tripId === t.id),
      };
    });

    return reply.send({ trips: tripsWithFormattedDates }).code(200);
  };

  createTrip: RouteHandlerWithBody<CreateTripBody, PossibleErrorResponse<CreateTripResponse>> = async (req, reply) => {
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
          transaction
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
  };

  getTripData: RouterHandlerWithParams<RouteWithTripIDParams, PossibleErrorResponse<GetTripDataResponse>> = async (req, reply) => {
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
  };

  getTripDataForEditing: RouterHandlerWithParams<RouteWithTripIDParams, PossibleErrorResponse<GetTripDataForEditingResponse>> = async (
    req,
    reply
  ) => {
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
  };

  updateTrip: RouteHandlerWithBodyAndParams<RouteWithTripIDParams, UpdateTripBody, PossibleErrorResponse<UpdateTripResponse>> = async (
    req,
    reply
  ) => {
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
          transaction
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
  };

  getExpensesForTrip: RouterHandlerWithParams<RouteWithTripIDParams, PossibleErrorResponse<GetExpensesForTripReponse>> = async (req, reply) => {
    const userId = req.requestContext.get('userId')!;
    const tripId = req.params.tripId;

    const trip = await this.tripRepository.findTripById({ userId, tripId });

    if (!trip) {
      return reply.code(400).send({ error: 'Trip not found' });
    }

    const expenses = await this.expenseRepository.findExpensesForTrip(tripId);

    const processedExpenses = expenses.map<ProcessedTripExpense>(parseExpenseForResponse);

    return reply.send({ expenses: processedExpenses }).code(200);
  };

  addExpenseForTrip: RouteHandlerWithBodyAndParams<AddExpenseForTripParams, AddExpenseForTripBody, PossibleErrorResponse> = async (req, reply) => {
    const { tripId } = req.params;
    const userId = req.requestContext.get('userId')!;
    const trip = await this.tripRepository.findTripById({ userId, tripId });

    if (!trip) {
      return reply.code(400).send({ error: 'Trip not found' });
    }

    const { localDateTime, cityId, amount, currencyId, categoryId, description, userId: expenseUserId } = req.body;

    const currencyToEurFXRate = await this.currencyRepository.getCurrencyFXRate(currencyId);

    const euroAmount = parseFloat((amount / currencyToEurFXRate).toFixed(2));

    const expense: NewExpenseRecord = {
      tripId,
      amount,
      currencyId,
      euroAmount,
      localDateTime,
      description,
      categoryId,
      cityId,
      userId: expenseUserId,
      createdByUserId: userId,
    };

    await this.expenseRepository.addExpenseForTrip(expense);

    return reply.status(201).send();
  };

  getExpenseStats: RouterHandlerWithParams<RouteWithTripIDParams, PossibleErrorResponse<GetExpenseStatsResponse>> = async (req, reply) => {
    const userId = req.requestContext.get('userId')!;
    const tripId = req.params.tripId;

    const trip = await this.tripRepository.findTripById({ userId, tripId });

    if (!trip) {
      return reply.code(400).send({ error: 'Trip not found' });
    }

    const [
      categoryBreakdown,
      categoryByUserBreakdown,
      userBreakdown,
      mostExpenseDay,
      leastExpensiveDay,
      countryBreakdown,
      cityBreakdown,
      dailyCostBreakdown,
      hourlySpendingBreakdown,
    ] = await Promise.all([
      this.expenseRepository.getExpenseCategoryBreakdownForTrip(tripId),
      this.expenseRepository.getExpenseCategoryBreakdownByUser(tripId),
      this.expenseRepository.getExpenseByUserBreakdownForTrip(tripId),
      this.expenseRepository.getMostExpensiveTripDay(tripId),
      this.expenseRepository.getLeastExpensiveTripDay(tripId),
      this.expenseRepository.getExpenseByCountryBreakdownForTrip(tripId),
      this.expenseRepository.getExpenseByCityBreakdownForTrip(tripId),
      this.expenseRepository.getDailyCostBreakdownForTrip(tripId),
      this.expenseRepository.getHourlySpendingBreakdown(tripId),
    ]);

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
  };

  deleteExpense: RouterHandlerWithParams<DeleteExpenseParams, PossibleErrorResponse<GetExpenseStatsResponse>> = async (req, reply) => {
    const userId = req.requestContext.get('userId')!;
    const tripId = req.params.tripId;
    const expenseId = req.params.expenseId;

    const trip = await this.tripRepository.findTripById({ userId, tripId });

    if (!trip) {
      return reply.code(400).send({ error: 'Trip not found' });
    }

    await this.expenseRepository.deleteExpenseForTrip(tripId, expenseId);

    return reply.status(204).send();
  };

  updateExpenseForTrip: RouteHandlerWithBodyAndParams<EditExpenseForTripParams, UpdateExpenseForTripBody, PossibleErrorResponse> = async (
    req,
    reply
  ) => {
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
  };

  deleteTrip: RouterHandlerWithParams<DeleteTripParams, PossibleErrorResponse> = async (req, reply) => {
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
  };
}

export default TripController;
