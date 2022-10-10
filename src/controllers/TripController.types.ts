import { DBTripResult } from '../repository/TripRepository.types';

export interface GetTripReponse {
  trips: DBTripResult[];
}
