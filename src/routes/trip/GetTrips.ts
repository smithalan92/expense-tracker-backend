import { FastifyInstance } from 'fastify';
import TripRepository from '../../repository/TripRepository';
import { ParsedTrip, parseTrip } from '../../utils/trip';

class GetTripsRoute {
  tripRepository: TripRepository;

  constructor({ tripRepository }: ContainerCradle) {
    this.tripRepository = tripRepository;
  }

  configure(server: FastifyInstance) {
    server.route<{
      Reply: PossibleErrorResponse<GetTripReponse>;
    }>({
      method: 'GET',
      url: '/v2/trips',
      handler: async (req, reply) => {
        const userId: number = req.requestContext.get('userId')!;

        const trips = await this.tripRepository.getTrips({ userId });

        const tripsWithFormattedDates = trips
          .map(parseTrip)
          .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());

        return reply.send({ trips: tripsWithFormattedDates }).code(200);
      },
    });
  }
}

export default GetTripsRoute;

interface GetTripReponse {
  trips: ParsedTrip[];
}
