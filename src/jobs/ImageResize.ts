import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import cron from 'node-cron';
import path from 'path';
import sharp from 'sharp';
import FileRepository from '../repository/FileRepository';

class ImageResize implements Job {
  env: Env;
  fileRepository: FileRepository;

  constructor({ env, fileRepository }: ContainerCradle) {
    this.env = env;
    this.fileRepository = fileRepository;
  }

  start() {
    // Server time is UTC
    const job = cron.schedule('30 04 * * *', () => {
      this.run().catch((err) => {
        console.error(err);
      });
    });
    void job.start();
    console.log('Scheduled ImageResize');
  }

  async run() {
    console.log('Running image resize');
    let resizeCount = 0;

    const files = await this.fileRepository.getUnprocessedFiles();

    if (files.length === 0) {
      console.log('No images to resize');
      return;
    }

    for (const file of files) {
      try {
        const filePath = path.join(this.env.EXPENSR_FILE_DIR, file.path);
        const { size } = await fs.stat(filePath);

        const fileSizeInKB = size / 1024;

        // Max image size range before we resize is 800kb (+ a little tolerance)
        if (fileSizeInKB / 800 <= 1.01) {
          await this.fileRepository.updateFile({
            id: file.id,
            processed: 1,
          });
          continue;
        }

        /*
         * To resize to our image to our target range we'll do the following.
         * 1. Get the decimal value of our target size vs the current size
         * 2. Reduce the width/height of the image by the given value
         */

        const reductionMultiplier = 400 / fileSizeInKB;

        const image = sharp(filePath);

        const { width, height } = await image.metadata();

        if (!width || !height) {
          console.log(`File id ${file.id} has no width or height info associated with it`);
          continue;
        }

        const newWidth = Math.floor(width * reductionMultiplier);
        const newHeight = Math.floor(height * reductionMultiplier);

        const fileExt = path.extname(file.path);
        const fileDir = path.dirname(file.path);
        const newFilePath = path.join(fileDir, `${randomUUID()}${fileExt}`);
        const fullNewFilePath = path.join(this.env.EXPENSR_FILE_DIR, newFilePath);

        await image.resize({ width: newWidth, height: newHeight }).toFile(fullNewFilePath);

        await this.fileRepository.updateFile({
          id: file.id,
          path: newFilePath,
          processed: 1,
        });

        await fs.rm(filePath);

        resizeCount += 1;
      } catch (err) {
        console.log(`Failed to update file id ${file.id}`);
        console.error(err);
      }
    }

    console.log(`Resized ${resizeCount} images`);
  }
}

export default ImageResize;
