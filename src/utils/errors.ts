import * as express from 'express';
import { HandleGuard } from './handleGuard';

export class YaguraError extends Error {

    constructor(err: Error | string) {
        super(err instanceof Error ? err.message : err);

        if (err instanceof Error) {
            Object.assign(this, err);
        }
    }

    public readonly guard: HandleGuard = new HandleGuard();
}

/** Error to be thrown when a method is not overriden properly (please don't use this) */
export class StubError extends Error {
    constructor() {
        super('Stub call: this function has not been overriden properly\nAlso double error! You should use an abstract method instead of this, douchenozzle!');
    }
}

export class VersionMismatchError extends YaguraError {}
