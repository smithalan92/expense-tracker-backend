import mysql from 'mysql2';

export interface DBCityResult extends mysql.RowDataPacket {
  id: number;
  name: string;
  countryId: number;
}
