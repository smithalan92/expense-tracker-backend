import format from 'date-fns/format';
import { ParsedTrip } from '../controllers/TripController.types';
import { DBTripResult } from '../repository/TripRepository.types';
import { getTripFileUrl } from './file';

export function parseTrip(trip: DBTripResult): ParsedTrip {
  const image = getTripFileUrl(trip.filePath);

  return {
    id: trip.id,
    name: trip.name,
    startDate: format(new Date(trip.startDate), 'dd MMM yyyy'),
    endDate: format(new Date(trip.endDate), 'dd MMM yyyy'),
    status: trip.status,
    image,
    totalLocalAmount: trip.totalLocalAmount,
    totalExpenseAmount: trip.totalExpenseAmount,
  };
}
