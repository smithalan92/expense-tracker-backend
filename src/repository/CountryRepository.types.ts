import mysql from 'mysql2';

export interface DBGetCountriesByIDResult extends mysql.RowDataPacket {
  id: number;
  name: string;
  tripId: number;
}
