import mysql from 'mysql2';

export interface DBGetCountriesByTripIDResult extends mysql.RowDataPacket {
  id: number;
  name: string;
  tripId: number;
}
