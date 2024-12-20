import { FastifyInstance } from 'fastify';
import Server from '../../lib/Server';
import CountryRepository, { type DBGetCountriesByTripIDResult } from '../../repository/CountryRepository';
import TripRepository from '../../repository/TripRepository';
import { parseTrip } from '../../utils/trip';

class GetTripsRoute {
  tripRepository: TripRepository;
  countryRepository: CountryRepository;

  constructor({ tripRepository, countryRepository }: GetTripsParams) {
    this.tripRepository = tripRepository;
    this.countryRepository = countryRepository;
  }

  configure(server: FastifyInstance) {
    server.route<{
      Reply: PossibleErrorResponse<GetTripReponse>;
    }>({
      method: 'GET',
      url: '/v2/trips',
      handler: async (req, reply) => {
        const userId: number = req.requestContext.get('userId')!;

        const trips = await this.tripRepository.findTripsForUserId(userId);

        const countriesIdsForTrips = trips.map((trip) => trip.id);

        const countries = await this.countryRepository.getCountriesForTrips(countriesIdsForTrips);

        const tripsWithFormattedDates = trips
          .map<ResponseTrip>((t) => {
            return {
              ...parseTrip(t),
              countries: countries.filter((c) => c.tripId === t.id),
            };
          })
          .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());

        return reply.send({ trips: tripsWithFormattedDates }).code(200);
      },
    });
  }
}

export default GetTripsRoute;

interface GetTripsParams {
  server: Server;
  tripRepository: TripRepository;
  countryRepository: CountryRepository;
}

export interface ParsedTrip {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'deleted';
  image: string;
  totalLocalAmount: number;
  totalExpenseAmount: number;
}

export interface ResponseTrip extends ParsedTrip {
  countries: DBGetCountriesByTripIDResult[];
}

export interface GetTripReponse {
  trips: ResponseTrip[];
}
