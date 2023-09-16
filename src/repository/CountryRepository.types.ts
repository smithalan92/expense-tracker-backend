import mysql from 'mysql2';

export interface DBCountriesResult extends mysql.RowDataPacket {
  id: number;
  name: string;
}

export interface DBGetCountriesByTripIDResult extends mysql.RowDataPacket {
  id: number;
  name: string;
  tripId: number;
  currencyCode: string;
  currencyId: number;
  cityIds: string | null;
}
