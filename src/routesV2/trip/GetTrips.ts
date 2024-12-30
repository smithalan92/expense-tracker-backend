import { FastifyInstance } from 'fastify';
import TripRepository__V2 from '../../repository/TripRepository__V2';
import { ParsedTrip, parseTrip } from '../../utils/trip';

class GetTripsRoute {
  tripRepository: TripRepository__V2;

  constructor({ tripRepositoryV2 }: ContainerCradle) {
    this.tripRepository = tripRepositoryV2;
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
