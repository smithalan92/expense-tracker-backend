import { OkPacket } from 'mysql2';
import DBAgent from '../lib/DBAgent';
import { ContainerCradle } from '../lib/types';
import { DBGetCurrenciesForSyncJobResult, DBGetCurrenciesResult } from './CurrencyRepository.types';

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
