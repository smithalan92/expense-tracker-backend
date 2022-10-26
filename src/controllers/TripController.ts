import { ContainerCradle } from '../lib/types';
import { PossibleErrorResponse, RouteHandler, RouteHandlerWithBodyAndParams, RouterHandlerWithParams } from '../types/routes';
import TripRepository from '../repository/TripRepository';
import {
  GetTripReponse,
  GetExpensesForTripReponse,
  GetExpensesForTripParams,
  ResponseTrip,
  GetCountriesForTripParams,
  GetCountriesForTripResponse,
  AddExpenseForTripBody,
  AddExpenseForTripParams,
  ProcessedTripExpense,
} from './TripController.types';
import { format } from 'date-fns';
import ExpenseRepository from '../repository/ExpenseRepository';
import CountryRepository from '../repository/CountryRepository';
import { NewExpenseRecord } from '../repository/ExpenseRepository.types';
import CurrencyRepository from '../repository/CurrencyRepository';

class TripController {
  tripRepository: TripRepository;
  expenseRepository: ExpenseRepository;
  countryRepository: CountryRepository;
  currencyRepository: CurrencyRepository;

  constructor({ tripRepository, expenseRepository, countryRepository, currencyRepository }: ContainerCradle) {
    this.tripRepository = tripRepository;
    this.expenseRepository = expenseRepository;
    this.countryRepository = countryRepository;
    this.currencyRepository = currencyRepository;
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

  getExpensesForTrip: RouterHandlerWithParams<GetExpensesForTripParams, PossibleErrorResponse<GetExpensesForTripReponse>> = async (req, reply) => {
    const userId: number = req.requestContext.get('userId');
    const tripId: number = req.params.tripId;

    let trip = await this.tripRepository.findTripById({ userId, tripId });

    if (!trip) {
      return reply.code(400).send({ error: 'Trip not found' });
    }

    const expenses = await this.expenseRepository.findExpensesForTrip(tripId);

    const processedExpenses = expenses.map<ProcessedTripExpense>((expense) => {
      const processedExpense: ProcessedTripExpense = {
        id: expense.id,
        amount: expense.amount.toFixed(2),
        currency: {
          id: expense.currencyId,
          code: expense.currencyCode,
          name: expense.currencyName,
        },
        euroAmount: expense.euroAmount.toFixed(2),
        localDateTime: expense.localDateTime,
        description: expense.description,
        category: {
          id: expense.categoryId,
          name: expense.categoryName,
        },
        city: {
          id: expense.cityId,
          name: expense.cityName,
          timezone: expense.cityTimeZone,
        },
        country: {
          id: expense.countryId,
          name: expense.countryName,
        },
        user: {
          id: expense.userId,
          firstName: expense.firstName,
        },
        createdAt: expense.createdAt,
        updatedAt: expense.updatedAt,
      };

      return processedExpense;
    });

    trip = {
      ...trip,
      startDate: format(new Date(trip.startDate), 'dd MMM yyyy'),
      endDate: format(new Date(trip.endDate), 'dd MMM yyyy'),
    };

    return reply.send({ trip, expenses: processedExpenses }).code(200);
  };

  getCountriesForTrip: RouterHandlerWithParams<GetCountriesForTripParams, PossibleErrorResponse<GetCountriesForTripResponse>> = async (
    req,
    reply
  ) => {
    const userId: number = req.requestContext.get('userId');
    const tripId: number = req.params.tripId;

    const trip = await this.tripRepository.findTripById({ userId, tripId });

    if (!trip) {
      return reply.code(400).send({ error: 'Trip not found' });
    }

    const countries = await this.countryRepository.getCountriesForTrips([tripId]);

    return reply.send({ countries });
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

    console.log(expense);

    await this.expenseRepository.addExpenseForTrip(expense);

    return reply.status(201).send();
  };
}

export default TripController;
