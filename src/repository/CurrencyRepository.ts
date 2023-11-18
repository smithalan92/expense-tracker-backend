import { type OkPacket } from 'mysql2';
import type DBAgent from '../lib/DBAgent';
import { type ContainerCradle } from '../lib/types';
import { type DBGetCurrenciesForSyncJobResult, type DBGetCurrenciesResult, type DBGetCurrencyFXRateResult } from './CurrencyRepository.types';

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

  async updateCurrencyExchangeRate({ currencyId, exchangeRate, fxDate }: { currencyId: number; exchangeRate: number; fxDate: string }) {
    const result = await this.dbAgent.runQuery<OkPacket>({
      query: `
        UPDATE currencies
        SET exchangeRate = ?, exchangeRateDate = ?, updatedAt = NOW()
        WHERE id = ?
      `,
      values: [exchangeRate, fxDate, currencyId],
    });

    if (result.changedRows !== 1) {
      console.error(new Error(`Failed to update fx rate for currency ${currencyId}`));
    }
  }
}

export default CurrencyRepository;
