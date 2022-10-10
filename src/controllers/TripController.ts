import { ContainerCradle } from '../lib/types';
import { PossibleErrorResponse, RouteHandler } from '../types/routes';
import TripRepository from '../repository/TripRepository';
import { GetTripReponse } from './TripController.types';

class TripController {
  tripRepository: TripRepository;

  constructor({ tripRepository }: ContainerCradle) {
    this.tripRepository = tripRepository;
  }

  getTrips: RouteHandler<PossibleErrorResponse<GetTripReponse>> = async (req, reply) => {
    return reply.send({ trips: [] }).code(200);
  };
}

export default TripController;
