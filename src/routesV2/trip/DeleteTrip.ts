import { FastifyInstance } from 'fastify';
import DBAgent from '../../lib/DBAgent';
import CountryRepository__V2 from '../../repository/CountryRepository__V2';
import CurrencyRepository__V2 from '../../repository/CurrencyRepository__V2';
import FileRepository__V2 from '../../repository/FileRepository__V2';
import TripRepository__V2 from '../../repository/TripRepository__V2';
import UserRepository__V2 from '../../repository/UserRepository__V2';

class DeleteTripRoute {
  tripRepository: TripRepository__V2;
  fileRepository: FileRepository__V2;
  countryRepository: CountryRepository__V2;
  userRepository: UserRepository__V2;
  currencyRepository: CurrencyRepository__V2;
  dbAgent: DBAgent;

  constructor({
    tripRepositoryV2,
    fileRepositoryV2,
    countryRepositoryV2,
    userRepositoryV2,
    currencyRepositoryV2,
    dbAgent,
  }: ContainerCradle) {
    this.tripRepository = tripRepositoryV2;
    this.fileRepository = fileRepositoryV2;
    this.countryRepository = countryRepositoryV2;
    this.userRepository = userRepositoryV2;
    this.currencyRepository = currencyRepositoryV2;
    this.dbAgent = dbAgent;
  }

  configure(server: FastifyInstance) {
    server.route<{
      Params: DeleteTripRouteParams;
      Reply: PossibleErrorResponse;
    }>({
      method: 'DELETE',
      url: '/v2/trip/:tripId',
      handler: async (req, reply) => {
        const userId: number = req.requestContext.get('userId')!;
        const tripId = req.params.tripId;

        const [existingTrip] = await this.tripRepository.getTrips({ userId, tripIds: [tripId] });

        if (!existingTrip) {
          return reply.code(400).send({ error: 'Trip not found' });
        }

        await this.tripRepository.updateTrip({
          tripId,
          data: {
            status: 'deleted',
          },
          currentUserId: userId,
        });

        return reply.code(204).send();
      },
    });
  }
}

export default DeleteTripRoute;

interface DeleteTripRouteParams {
  tripId: number;
}
