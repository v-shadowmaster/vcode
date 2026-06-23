import chalk from 'chalk';
import { config, SERVICE_NAME } from '../config/env';
import { logger } from './logger';

interface BannerInfo {
  readonly url: string;
  readonly healthUrl: string;
  readonly startupMs: number;
}

/** Prints a readable startup banner in dev and a structured log line in production. */
export const printStartupBanner = ({ url, healthUrl, startupMs }: BannerInfo): void => {
  if (config.IS_PRODUCTION) {
    logger.info('Server started', {
      env: config.NODE_ENV,
      version: config.VERSION,
      url,
      pid: process.pid,
      startupMs,
    });
    return;
  }

  const arrow = chalk.green('➜');
  const label = (text: string): string => chalk.bold(text.padEnd(7));

  console.log();
  console.log(`  ${chalk.bgGreen.black(` ${SERVICE_NAME} `)} ${chalk.gray(`ready in ${startupMs} ms`)}`);
  console.log();
  console.log(`  ${arrow} ${label('Local')} ${chalk.cyan(url)}`);
  console.log(`  ${arrow} ${label('Health')} ${chalk.cyan(healthUrl)}`);
  console.log(
    `  ${arrow} ${label('Env')} ${chalk.yellow(config.NODE_ENV)} ${chalk.gray('·')} v${config.VERSION} ${chalk.gray('·')} pid ${process.pid}`,
  );
  console.log();
};
