import { Service } from '../framework/service';
import { Event } from '../framework/event';
import 'colors';

export enum LogLevel {
    error = 'error',
    warn = 'warn',
    info = 'info',
    debug = 'debug',
    verbose = 'verbose',
}

type AbstractLogger = {
    [Key in LogLevel]: (x: any) => void;
}

export abstract class Logger extends Service implements AbstractLogger {
    constructor(vendor: string) {
        super('Logger', vendor);
    }

    // TODO: review which logging level standard to adopt, like POSIX, Winston, etc.
    /**
     * 
     * @param text Log message
     * @param {Event} event Yagura Event provided as context
     */
    public abstract error(text: any, event?: Event): void;
    public abstract warn(text: string, event?: Event): void;
    public abstract info(text: string, event?: Event): void;
    public abstract debug(text: string, event?: Event): void;
    public abstract verbose(text: string, event?: Event): void;
}

/**
 * Default implementation of the Logger service;
 * Doesn't rely on any external dependencies, except for 'colors.ts' to colorize the text according to the error level
 * Uses stdout/stderr to output logs
 */
export class DefaultLogger extends Logger {
    constructor() {
        super('Default');
    }

    public error(err: string | Error): void { console.error(`[ERROR] ${err instanceof Error ? err.stack.toString().dim : err}`.red); }
    public warn(text: string): void { console.log(`[WARN] ${text}`.yellow); }
    public info(text: string): void { console.log(`[INFO] ${text}`.white); }
    public debug(text: string): void { console.log(`[DEBUG] ${text}`.blue); }
    public verbose(text: string): void { console.log(`[VERBOSE] ${text}`.cyan); }
}
