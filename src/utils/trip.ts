import { format } from 'date-fns/format';
import type { DBGetTripsResult } from '../repository/TripRepository';
import { getTripFileUrl } from './file';

export function parseTrip(trip: DBGetTripsResult): ParsedTrip {
  const image = getTripFileUrl(trip.filePath);

  return {
    id: trip.id,
    name: trip.name,
    startDate: format(new Date(trip.startDate), 'dd MMM yyyy'),
    endDate: format(new Date(trip.endDate), 'dd MMM yyyy'),
    image,
    totalExpenseAmount: trip.totalExpenseAmount,
    countries: trip.countries ?? [],
    users: trip.users ?? [],
    expenseCount: trip.expenseCount ?? 0,
  };
}

export interface ParsedTrip {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  image: string;
  totalExpenseAmount: number;
  countries: Array<{ id: number; name: string }>;
  users: Array<{ id: number; name: string }>;
  expenseCount: number;
}
