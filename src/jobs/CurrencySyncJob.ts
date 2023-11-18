import { type ContainerCradle } from '../lib/types';
import type CurrencyRepository from '../repository/CurrencyRepository';
import { type Job } from '../types/job.types';
import cron from 'node-cron';
import { getExchangeRatesForEUR } from '../api/currency';

class CurrencySyncJob implements Job {
  currencyRepository: CurrencyRepository;

  constructor({ currencyRepository }: ContainerCradle) {
    this.currencyRepository = currencyRepository;
  }

  start() {
    // Server time is UTC
    const job = cron.schedule('8 22 * * *', () => {
      this.run().catch((err) => {
        console.error(err);
      });
    });
    job.start();
    console.log('Scheduled CurrencySyncJob');
  }

  async run() {
    console.log('Running currency sync');
    const { date, eur: fxRates } = await getExchangeRatesForEUR();
    const currencies = await this.currencyRepository.getCurrenciesForSyncJob();

    const updateData: Array<{ id: number; fxRate: number }> = [];

    currencies.forEach((currency) => {
      const { id, code, exchangeRate } = currency;

      const fxRate = fxRates[code.toLowerCase()];

      if (!fxRate) {
        console.error('Missing FX rate for ', code);
        return;
      }

      if (fxRate === exchangeRate) return; // There the same no need

      updateData.push({ id, fxRate });
    });

    if (!updateData.length) return;

    for (const data of updateData) {
      try {
        await this.currencyRepository.updateCurrencyExchangeRate({
          currencyId: data.id,
          exchangeRate: data.fxRate,
          fxDate: date,
        });
      } catch (err) {
        console.error(`Failed to update fx rate for currency id ${data.id}`);
      }
    }
  }
}

export default CurrencySyncJob;
