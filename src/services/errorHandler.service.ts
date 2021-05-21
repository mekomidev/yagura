import { Service } from '../framework/service';
import { Logger } from './logger.service';

export abstract class ErrorHandler extends Service {
    constructor(vendor: string) {
        super('ErrorHandler', vendor);
    }

    public abstract handle(err: Error): Promise<void> | void;
}

/**
 * Default implementation of the ErrorHandler service;
 * Depends on the Logger module to output logs to console
 */
export class DefaultErrorHandler extends ErrorHandler {
    constructor() {
        super('Default');
    }

    // eslint-disable-next-line @typescript-eslint/require-await

    public async handle(err: Error) {
        this.yagura.getService<Logger>('Logger').error(err);
        return new Promise<void>((resolve) => resolve);
    }
}
