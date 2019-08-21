import { Module } from '../framework/module';
import _colors = require('colors');

export abstract class Logger extends Module {
    constructor(vendor: string) {
        super(vendor, 'Logger');
    }

    // TODO: review which logging level standard to adopt, like POSIX, Winston, etc.
    public abstract error(text: any): void;
    public abstract warn(text: string): void;
    public abstract info(text: string): void;
    public abstract debug(text: string): void;
    public abstract verbose(text: string): void;
}

/**
 * Default implementation of the Logger module;
 * Doesn't rely on any external dependencies, except for 'colors.ts' to colorize the text according to the error level
 * Uses stdout/stderr to output logs
 */
export class DefaultLogger extends Logger {
    constructor() {
        super('Default');
    }

    public error(err: string | Error): void { console.error(err.toString().red); }
    public warn(text: string): void { console.log(text.yellow); }
    public info(text: string): void { console.log(text.white); }
    public debug(text: string): void { console.log(text.blue); }
    public verbose(text: string): void { console.log(text.cyan); }
}
