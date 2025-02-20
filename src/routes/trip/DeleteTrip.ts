import { FastifyInstance } from 'fastify';
import DBAgent from '../../lib/DBAgent';
import CountryRepository from '../../repository/CountryRepository';
import CurrencyRepository from '../../repository/CurrencyRepository';
import FileRepository from '../../repository/FileRepository';
import TripRepository from '../../repository/TripRepository';
import UserRepository from '../../repository/UserRepository';

class DeleteTripRoute {
  tripRepository: TripRepository;
  fileRepository: FileRepository;
  countryRepository: CountryRepository;
  userRepository: UserRepository;
  currencyRepository: CurrencyRepository;
  dbAgent: DBAgent;

  constructor({
    tripRepository,
    fileRepository,
    countryRepository,
    userRepository,
    currencyRepository,
    dbAgent,
  }: ContainerCradle) {
    this.tripRepository = tripRepository;
    this.fileRepository = fileRepository;
    this.countryRepository = countryRepository;
    this.userRepository = userRepository;
    this.currencyRepository = currencyRepository;
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
