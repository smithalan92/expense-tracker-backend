import type mysql from 'mysql2';

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

export interface DBGetCityOptionsForTripIdCountry extends mysql.RowDataPacket {
  countryId: number;
  cityIds: string | null;
}
