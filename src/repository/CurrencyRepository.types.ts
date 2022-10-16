import mysql from 'mysql2';

export interface DBCurrencyResult extends mysql.RowDataPacket {
  id: number;
  code: string;
  exchangeRate: number;
}
