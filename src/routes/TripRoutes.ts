import { FastifyInstance } from 'fastify';
import TripController from '../controllers/TripController';
import { GetTripReponse } from '../controllers/TripController.types';
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
  }
}

export default TripRoutes;
