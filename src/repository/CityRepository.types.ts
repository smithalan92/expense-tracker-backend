import mysql from 'mysql2';

export interface DBGetCityOptionsForTripIdResult extends mysql.RowDataPacket {
  id: number;
  name: string;
  countryId: number;
}

export interface DBCityResult extends mysql.RowDataPacket {
  id: number;
  name: string;
  countryId: number;
}
