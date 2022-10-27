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
  }
}

export default TripRoutes;
