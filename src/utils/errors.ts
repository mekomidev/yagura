import * as express from 'express';

/** Error to be thrown when a method is not overriden properly (please don't use this) */
export class StubError extends Error {
    constructor() {
        super('Stub call: this function has not been overriden properly\nAlso double error! You should use an abstract method instead of this, douchenozzle!');
    }
}

export class YaguraError extends Error {}
