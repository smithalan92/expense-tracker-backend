import mysql from 'mysql2';

export interface DBTripResult extends mysql.RowDataPacket {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'deleted';
  image: string;
  totalLocalAmount: number;
  totalExpenseAmount: number;
}

export interface DBFindUsersForTripResult extends mysql.RowDataPacket {
  id: number;
  firstName: string;
  lastName: string;
}

export interface UsersForTrip {
  [key: number]: Omit<DBFindUsersForTripResult, 'constructor' | 'id'>;
}
