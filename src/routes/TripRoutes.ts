import { FastifyInstance } from 'fastify';
import TripController from '../controllers/TripController';
import {
  GetCountriesForTripParams,
  GetCountriesForTripResponse,
  GetExpensesForTripParams,
  GetExpensesForTripReponse,
  GetTripReponse,
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
      Params: GetExpensesForTripParams;
      Reply: PossibleErrorResponse<GetExpensesForTripReponse>;
    }>({
      method: 'GET',
      url: '/trips/:tripId/expenses',
      handler: this.controller.getExpensesForTrip,
    });

    server.route<{
      Params: GetCountriesForTripParams;
      Reply: PossibleErrorResponse<GetCountriesForTripResponse>;
    }>({
      method: 'GET',
      url: '/trips/:tripId/countries',
      handler: this.controller.getCountriesForTrip,
    });
  }
}

export default TripRoutes;
