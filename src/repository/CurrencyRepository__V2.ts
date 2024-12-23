import type mysql from 'mysql2';
import type DBAgent from '../lib/DBAgent';

class CurrencyRepository__V2 {
  dbAgent: DBAgent;

  constructor({ dbAgent }: ContainerCradle) {
    this.dbAgent = dbAgent;
  }

  async getFXRatesForCurrencies(currencyIds: number[]) {
    const results = await this.dbAgent.runQuery<DBGetFXRatesForCurrencies__V2[]>({
      query: `
        SELECT id, exchangeRate
        FROM currencies
        WHERE id IN (${this.dbAgent.prepareArrayForInValue(currencyIds)})
      `,
    });

    return results;
  }
}

export default CurrencyRepository__V2;

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

export interface DBGetFXRatesForCurrencies__V2 extends mysql.RowDataPacket {
  id: number;
  exchangeRate: number;
}
