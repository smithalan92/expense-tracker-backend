import type mysql from 'mysql2';
import { type CreateTripBody } from '../controllers/TripController.types';

export interface DBTripResult extends mysql.RowDataPacket {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'deleted';
  filePath: string | null;
  totalLocalAmount: number;
  totalExpenseAmount: number;
}

export interface DBFindUsersForTripResult extends mysql.RowDataPacket {
  id: number;
  firstName: string;
  lastName: string;
}

export type UsersForTrip = Record<number, Omit<DBFindUsersForTripResult, 'constructor' | 'id'>>;

export type CreateTripParams = Omit<CreateTripBody, 'file'>;
