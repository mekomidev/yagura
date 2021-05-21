import { Service } from '../framework/service';
import 'colors';

export abstract class Logger extends Service {
    constructor(vendor: string) {
        super('Logger', vendor);
    }

    // TODO: review which logging level standard to adopt, like POSIX, Winston, etc.
    public abstract error(text: any): void;
    public abstract warn(text: string): void;
    public abstract info(text: string): void;
    public abstract debug(text: string): void;
    public abstract verbose(text: string): void;
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
