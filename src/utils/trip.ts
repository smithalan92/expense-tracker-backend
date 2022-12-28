import { ParsedTrip } from '../controllers/TripController.types';
import { DBTripResult } from '../repository/TripRepository.types';
import { getTripFileUrl } from './file';

export function parseTrip(trip: DBTripResult): ParsedTrip {
  const image = getTripFileUrl(trip.filePath);

  return {
    id: trip.id,
    name: trip.name,
    startDate: trip.startDate,
    endDate: trip.endDate,
    status: trip.status,
    image,
    totalLocalAmount: trip.totalLocalAmount,
    totalExpenseAmount: trip.totalExpenseAmount,
  };
}
