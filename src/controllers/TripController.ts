import { ContainerCradle } from '../lib/types';
import { PossibleErrorResponse, RouteHandler, RouterHandlerWithParams } from '../types/routes';
import TripRepository from '../repository/TripRepository';
import { GetTripReponse, GetExpensesForTripReponse, GetExpensesForTripParams, ResponseTrip } from './TripController.types';
import { format } from 'date-fns';
import ExpenseRepository from '../repository/ExpenseRepository';
import CountryRepository from '../repository/CountryRepository';

class TripController {
  tripRepository: TripRepository;
  expenseRepository: ExpenseRepository;
  countryRepository: CountryRepository;

  constructor({ tripRepository, expenseRepository, countryRepository }: ContainerCradle) {
    this.tripRepository = tripRepository;
    this.expenseRepository = expenseRepository;
    this.countryRepository = countryRepository;
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

    let expenses = await this.expenseRepository.findExpensesForTrip(tripId);

    expenses = expenses.map((expense) => {
      expense.date = format(new Date(expense.date), 'dd MMM yyyy');
      expense.euroAmount = parseFloat(expense.euroAmount.toFixed(2));
      return expense;
    });

    trip = {
      ...trip,
      startDate: format(new Date(trip.startDate), 'dd MMM yyyy'),
      endDate: format(new Date(trip.endDate), 'dd MMM yyyy'),
    };

    return reply.send({ trip, expenses }).code(200);
  };
}

export default TripController;
