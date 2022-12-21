import { ContainerCradle } from '../lib/types';
import { PossibleErrorResponse, RouteHandler, RouteHandlerWithBodyAndParams, RouterHandlerWithParams } from '../types/routes';
import TripRepository from '../repository/TripRepository';
import {
  GetTripReponse,
  GetExpensesForTripReponse,
  RouteWithTripIDParams,
  ResponseTrip,
  AddExpenseForTripBody,
  AddExpenseForTripParams,
  GetTripDataResponse,
  GetExpenseStatsResponse,
  DeleteExpenseParams,
  EditExpenseForTripParams,
  UpdateExpenseForTripBody,
} from './TripController.types';
import { format } from 'date-fns';
import ExpenseRepository from '../repository/ExpenseRepository';
import CountryRepository from '../repository/CountryRepository';
import { NewExpenseRecord } from '../repository/ExpenseRepository.types';
import CurrencyRepository from '../repository/CurrencyRepository';
import CityRepository from '../repository/CityRepository';
import CategoryRepository from '../repository/CategoryRepository';
import { parseExpenseForResponse } from '../utils/expenseParser';
import { ProcessedTripExpense } from '../utils/expenseParser.types';

class TripController {
  tripRepository: TripRepository;
  expenseRepository: ExpenseRepository;
  countryRepository: CountryRepository;
  currencyRepository: CurrencyRepository;
  cityRepository: CityRepository;
  categoryRepository: CategoryRepository;

  constructor({ tripRepository, expenseRepository, countryRepository, currencyRepository, cityRepository, categoryRepository }: ContainerCradle) {
    this.tripRepository = tripRepository;
    this.expenseRepository = expenseRepository;
    this.countryRepository = countryRepository;
    this.currencyRepository = currencyRepository;
    this.cityRepository = cityRepository;
    this.categoryRepository = categoryRepository;
  }

  getTrips: RouteHandler<PossibleErrorResponse<GetTripReponse>> = async (req, reply) => {
    const userId: number = req.requestContext.get('userId');

    const trips = await this.tripRepository.findTripsForUserId(userId);

    const countriesIdsForTrips = trips.map((trip) => trip.id);

    const countries = await this.countryRepository.getCountriesForTrips(countriesIdsForTrips);

    const tripsWithFormattedDates = trips.map<ResponseTrip>((t) => {
      const trip: ResponseTrip = {
        ...t,
        countries: countries.filter((c) => c.tripId === t.id),
      };
      trip.startDate = format(new Date(t.startDate), 'dd MMM yyyy');
      trip.endDate = format(new Date(t.endDate), 'dd MMM yyyy');
      return trip;
    });

    return reply.send({ trips: tripsWithFormattedDates }).code(200);
  };

  getTripData: RouterHandlerWithParams<RouteWithTripIDParams, PossibleErrorResponse<GetTripDataResponse>> = async (req, reply) => {
    const userId: number = req.requestContext.get('userId');
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

    return reply
      .send({
        trip,
        expenses: processedExpenses,
        cities,
        countries,
        currencies,
        categories,
        users,
      })
      .code(200);
  };

  getExpensesForTrip: RouterHandlerWithParams<RouteWithTripIDParams, PossibleErrorResponse<GetExpensesForTripReponse>> = async (req, reply) => {
    const userId: number = req.requestContext.get('userId');
    const tripId: number = req.params.tripId;

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
    const userId: number = req.requestContext.get('userId');
    const trip = await this.tripRepository.findTripById({ userId, tripId });

    if (!trip) {
      return reply.code(400).send({ error: 'Trip not found' });
    }

    const { localDateTime, cityId, amount, currencyId, categoryId, description } = req.body;

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
      userId,
    };

    await this.expenseRepository.addExpenseForTrip(expense);

    return reply.status(201).send();
  };

  getExpenseStats: RouterHandlerWithParams<RouteWithTripIDParams, PossibleErrorResponse<GetExpenseStatsResponse>> = async (req, reply) => {
    const userId: number = req.requestContext.get('userId');
    const tripId: number = req.params.tripId;

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
    const userId: number = req.requestContext.get('userId');
    const tripId: number = req.params.tripId;
    const expenseId: number = req.params.expenseId;

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
    const userId: number = req.requestContext.get('userId');
    const updateData = req.body;

    const expense = await this.expenseRepository.getExpense(expenseId, userId);

    if (!expense) {
      return reply.code(404).send({ error: 'Trip or expense not found' });
    }

    const hasValidUpdateData = !!Object.values(updateData).find((v) => v !== null && v !== undefined);

    if (!hasValidUpdateData) {
      return reply.code(400).send({ error: 'Not valid update data provided' });
    }

    if (updateData.amount) {
      const currencyId = updateData.currencyId ?? expense.currencyId;
      const currencyToEurFXRate = await this.currencyRepository.getCurrencyFXRate(currencyId);
      updateData.euroAmount = parseFloat((updateData.amount / currencyToEurFXRate).toFixed(2));
    }

    await this.expenseRepository.updateExpenseForTrip(tripId, expenseId, userId, updateData);

    return reply.status(200).send();
  };
}

export default TripController;
