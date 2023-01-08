import { ContainerCradle, Env } from '../lib/types';
import { Job } from '../types/job.types';
import cron from 'node-cron';
import path from 'path';
import fs from 'fs/promises';
import differenceInMinutes from 'date-fns/differenceInMinutes';

class TempFileCleanup implements Job {
  env: Env;

  constructor({ env }: ContainerCradle) {
    this.env = env;
  }

  start() {
    // Server time is UTC
    const job = cron.schedule('0 * * * *', () => {
      this.run().catch((err) => {
        console.error(err);
      });
    });
    job.start();
    console.log('Scheduled TempFileCleanup');
  }

  async run() {
    console.log('Running file cleanup');
    const files = await fs.readdir(this.env.EXPENSR_TMP_DIR);
    let removeCount = 0;

    for await (const f of files) {
      const filePath = path.join(this.env.EXPENSR_TMP_DIR, f);
      const { ctime } = await fs.stat(filePath);
      const minDiff = differenceInMinutes(new Date(), new Date(ctime));

      if (minDiff > 10) {
        await fs.rm(filePath);
        removeCount += 1;
      }
    }

    console.log(`Cleaned up ${removeCount} temp files`);
  }
}

export default TempFileCleanup;
