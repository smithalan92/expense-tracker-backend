import { ContainerCradle } from '../lib/types';
import { PossibleErrorResponse, RouteHandler } from '../types/routes';
import TripRepository from '../repository/TripRepository';
import { GetTripReponse } from './TripController.types';
import { format } from 'date-fns';

class TripController {
  tripRepository: TripRepository;

  constructor({ tripRepository }: ContainerCradle) {
    this.tripRepository = tripRepository;
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
}

export default TripController;
