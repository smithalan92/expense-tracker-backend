import { FastifyInstance } from 'fastify';
import TripController from '../controllers/TripController';
import {
  AddExpenseForTripBody,
  AddExpenseForTripParams,
  GetTripDataResponse,
  RouteWithTripIDParams,
  GetExpensesForTripReponse,
  GetTripReponse,
  GetExpenseStatsResponse,
  DeleteExpenseParams,
  EditExpenseForTripParams,
  UpdateExpenseForTripBody,
  CreateTripBody,
  CreateTripResponse,
} from '../controllers/TripController.types';
import { Router, ContainerCradle } from '../lib/types';
import { PossibleErrorResponse } from '../types/routes';

class TripRoutes implements Router {
  controller: TripController;

  constructor({ tripController }: ContainerCradle) {
    this.controller = tripController;
  }

  configure(server: FastifyInstance) {
    server.route<{
      Reply: PossibleErrorResponse<GetTripReponse>;
    }>({
      method: 'GET',
      url: '/trips',
      handler: this.controller.getTrips,
    });

    server.route<{
      Params: RouteWithTripIDParams;
      Reply: PossibleErrorResponse<GetExpensesForTripReponse>;
    }>({
      method: 'GET',
      url: '/trips/:tripId/expenses',
      handler: this.controller.getExpensesForTrip,
    });

    server.route<{
      Params: RouteWithTripIDParams;
      Reply: PossibleErrorResponse<GetTripDataResponse>;
    }>({
      method: 'GET',
      url: '/trips/:tripId/data',
      handler: this.controller.getTripData,
    });

    server.route<{
      Params: RouteWithTripIDParams;
      Reply: PossibleErrorResponse<GetExpenseStatsResponse>;
    }>({
      method: 'GET',
      url: '/trips/:tripId/stats',
      handler: this.controller.getExpenseStats,
    });

    server.route<{
      Params: AddExpenseForTripParams;
      Body: AddExpenseForTripBody;
      Reply: PossibleErrorResponse;
    }>({
      method: 'POST',
      url: '/trips/:tripId/expense',
      handler: this.controller.addExpenseForTrip,
    });

    server.route<{
      Params: DeleteExpenseParams;
      Reply: PossibleErrorResponse<any>;
    }>({
      method: 'DELETE',
      url: '/trips/:tripId/expense/:expenseId',
      handler: this.controller.deleteExpense,
    });

    server.route<{
      Params: EditExpenseForTripParams;
      Body: UpdateExpenseForTripBody;
      Reply: PossibleErrorResponse;
    }>({
      method: 'PATCH',
      url: '/trips/:tripId/expense/:expenseId',
      handler: this.controller.updateExpenseForTrip,
    });

    server.route<{
      Body: CreateTripBody;
      Reply: PossibleErrorResponse<CreateTripResponse>;
    }>({
      method: 'POST',
      url: '/trips',
      handler: this.controller.createTrip,
    });
  }
}

export default TripRoutes;
