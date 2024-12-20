import type mysql from 'mysql2';
import { ResultSetHeader } from 'mysql2';
import type DBAgent from '../lib/DBAgent';

class CurrencyRepository {
  dbAgent: DBAgent;

  constructor({ dbAgent }: ContainerCradle) {
    this.dbAgent = dbAgent;
  }

  async getCurrencies() {
    const results = await this.dbAgent.runQuery<DBGetCurrenciesResult[]>({
      query: `
        SELECT id, code, name
        FROM currencies
        ORDER BY name;
      `,
    });

    return results;
  }

  async getCurrencyFXRate(currencyId: number) {
    const [result] = await this.dbAgent.runQuery<DBGetCurrencyFXRateResult[]>({
      query: `
        SELECT exchangeRate
        FROM currencies
        WHERE id = ?
      `,
      values: [currencyId],
    });

    if (!result) {
      throw new Error(`Could not find currency id ${currencyId}`);
    }

    return result.exchangeRate;
  }

  async getFXRatesForCurrencies__V2(currencyIds: number[]) {
    const results = await this.dbAgent.runQuery<DBGetFXRatesForCurrencies__V2[]>({
      query: `
        SELECT id, exchangeRate
        FROM currencies
        WHERE id IN (${this.dbAgent.prepareArrayForInValue(currencyIds)})
      `,
    });

    return results;
  }

  async getCurrenciesForSyncJob() {
    const results = await this.dbAgent.runQuery<DBGetCurrenciesForSyncJobResult[]>({
      query: `
        SELECT id, code, exchangeRate
        FROM currencies
        WHERE isBaseCurrency = 0
        AND isManuallyUpdated = 0;
      `,
    });

    return results;
  }

  async updateCurrencyExchangeRate({
    currencyId,
    exchangeRate,
    fxDate,
  }: {
    currencyId: number;
    exchangeRate: number;
    fxDate: string;
  }) {
    const result = await this.dbAgent.runQuery<ResultSetHeader>({
      query: `
        UPDATE currencies
        SET exchangeRate = ?, exchangeRateDate = ?, updatedAt = NOW()
        WHERE id = ?
      `,
      values: [exchangeRate, fxDate, currencyId],
    });

    if (result.affectedRows !== 1) {
      console.error(new Error(`Failed to update fx rate for currency ${currencyId}`));
    }
  }
}

export default CurrencyRepository;

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
