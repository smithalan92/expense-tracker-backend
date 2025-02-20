import { randomUUID } from 'crypto';
import { FastifyInstance } from 'fastify';
import DBAgent from '../../lib/DBAgent';
import CountryRepository, { TripCountryWithCities } from '../../repository/CountryRepository';
import CurrencyRepository from '../../repository/CurrencyRepository';
import FileRepository from '../../repository/FileRepository';
import TripRepository from '../../repository/TripRepository';
import UserRepository from '../../repository/UserRepository';
import { ParsedTrip, parseTrip } from '../../utils/trip';

class UpdateTripRoute {
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
      Params: UpdateTripRouteParams;
      Body: UpdateTripBody;
      Reply: PossibleErrorResponse<UpdateTripResponse>;
    }>({
      method: 'PATCH',
      url: '/v2/trip/:tripId',
      handler: async (req, reply) => {
        const userId: number = req.requestContext.get('userId')!;
        const tripId = req.params.tripId;
        const { name, startDate, endDate, file, countries, userIds } = req.body;

        const [existingTrip] = await this.tripRepository.getTrips({ userId, tripIds: [tripId] });

        if (!existingTrip) {
          return reply.code(400).send({ error: 'Trip not found' });
        }

        if (userIds && !userIds.includes(userId)) {
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

          await this.tripRepository.updateTrip({
            tripId,
            currentUserId: userId,
            data: { name, startDate, endDate, countries, userIds, fileId },
            transaction,
          });

          await transaction.commit();

          const [[trip], updatedCountriesWithCities, updatedUserIds, updatedCurrencyIds] = await Promise.all([
            this.tripRepository.getTrips({ tripIds: [tripId] }),
            this.countryRepository.getSelectedCountriesAndCitiesForTrip(tripId),
            this.userRepository.getUserIdsForTrip(tripId),
            this.currencyRepository.getCurrencyIdsForTrip(tripId),
          ]);

          return reply.code(201).send({
            trip: parseTrip(trip),
            countries: updatedCountriesWithCities,
            userIds: updatedUserIds,
            currencyIds: updatedCurrencyIds,
          });
        } catch (err) {
          await transaction.rollback();
          throw err;
        }
      },
    });
  }
}

export default UpdateTripRoute;

interface UpdateTripRouteParams {
  tripId: number;
}

interface UpdateTripResponse {
  trip: ParsedTrip;
  countries: TripCountryWithCities[];
  userIds: number[];
  currencyIds: number[];
}

interface UpdateTripBody {
  name?: string;
  startDate?: string;
  endDate?: string;
  file?: string;
  countries?: { countryId: number; cityIds?: number[] }[];
  userIds?: number[];
}
