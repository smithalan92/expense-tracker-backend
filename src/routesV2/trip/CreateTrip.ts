import { randomUUID } from 'crypto';
import { FastifyInstance } from 'fastify';
import DBAgent from '../../lib/DBAgent';
import FileRepository__V2 from '../../repository/FileRepository__V2';
import TripRepository__V2 from '../../repository/TripRepository__V2';
import { ParsedTrip, parseTrip } from '../../utils/trip';

class CreateTripRoute {
  tripRepository: TripRepository__V2;
  fileRepository: FileRepository__V2;
  dbAgent: DBAgent;

  constructor({ tripRepositoryV2, fileRepositoryV2, dbAgent }: ContainerCradle) {
    this.tripRepository = tripRepositoryV2;
    this.fileRepository = fileRepositoryV2;
    this.dbAgent = dbAgent;
  }

  configure(server: FastifyInstance) {
    server.route<{
      Body: CreateTripBody;
      Reply: PossibleErrorResponse<CreateTripResponse>;
    }>({
      method: 'POST',
      url: '/v2/trip',
      handler: async (req, reply) => {
        const userId: number = req.requestContext.get('userId')!;

        const { name, startDate, endDate, file, countries, userIds } = req.body;

        if (!userIds.includes(userId)) {
          // Always make sure the current user is a member of the trip
          userIds.push(userId);
        }

        const transaction = await this.dbAgent.createTransaction();

        await transaction.begin();

        try {
          let fileId: number | undefined = undefined;

          if (file) {
            const fId = await this.fileRepository.saveTempFile(
              {
                userId,
                fileName: file,
                destPath: `/trips/${randomUUID()}`,
              },
              transaction,
            );

            fileId = fId;
          }

          const tripId = await this.tripRepository.createTrip(
            { name, startDate, endDate, countries, userIds: Array.from(new Set(userIds)), fileId },
            transaction,
          );

          await transaction.commit();

          const [trip] = await this.tripRepository.getTrips({ tripIds: [tripId] });

          return reply.code(201).send({ trip: parseTrip(trip) });
        } catch (err) {
          await transaction.rollback();
          throw err;
        }
      },
    });
  }
}

export default CreateTripRoute;

interface CreateTripResponse {
  trip: ParsedTrip;
}

interface CreateTripBody {
  name: string;
  startDate: string;
  endDate: string;
  file?: string;
  countries: { countryId: number; cityIds?: number[] }[];
  userIds: number[];
}
