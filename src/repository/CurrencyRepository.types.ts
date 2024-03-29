import type mysql from 'mysql2';

export interface DBGetCurrenciesForSyncJobResult extends mysql.RowDataPacket {
  id: number;
  code: string;
  exchangeRate: number;
}

export interface DBGetCurrenciesResult extends mysql.RowDataPacket {
  id: number;
  code: number;
  name: string;
}

export interface DBGetCurrencyFXRateResult extends mysql.RowDataPacket {
  exchangeRate: number;
}
