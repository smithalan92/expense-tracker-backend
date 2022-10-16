import { ContainerCradle } from '../lib/types';
import { PossibleErrorResponse, RouteHandler, RouterHandlerWithParams } from '../types/routes';
import TripRepository from '../repository/TripRepository';
import { GetTripReponse, GetExpensesForTripReponse, GetExpensesForTripParams } from './TripController.types';
import { format } from 'date-fns';
import ExpenseRepository from '../repository/ExpenseRepository';

class TripController {
  tripRepository: TripRepository;
  expenseRepository: ExpenseRepository;

  constructor({ tripRepository, expenseRepository }: ContainerCradle) {
    this.tripRepository = tripRepository;
    this.expenseRepository = expenseRepository;
  }

  getTrips: RouteHandler<PossibleErrorResponse<GetTripReponse>> = async (req, reply) => {
    const userId: number = req.requestContext.get('userId');

    const trips = await this.tripRepository.findTripsForUserId(userId);

    const tripsWithFormattedDates = trips.map((trip) => {
      trip.startDate = format(new Date(trip.startDate), 'dd MMM yyyy');
      trip.endDate = format(new Date(trip.endDate), 'dd MMM yyyy');
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
