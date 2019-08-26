import { deepFreeze } from '../utils/objectUtils';
import { VersionMismatchError } from '../utils/errors';
import { YaguraEvent, EventHandler, EventFilter } from './event';
import { Yagura } from './yagura';

import * as SemVer from 'semver';

export abstract class Overlay implements EventHandler {
    public readonly name: string;
    public readonly yaguraVersion?: SemVer.Range;

    public readonly config: any;

    /**
     * Initializes the Overlay
     *
     * @param {any} config Overlay configuration object. Should be a plain JSON object, any functions will be excluded
     */
    constructor(name: string, config: any, yaguraVersion?: SemVer.Range) {
        this.name = name;
        this.yaguraVersion = yaguraVersion;

        // Compare Yagura versions if necessary
        if (!!yaguraVersion && !SemVer.satisfies(Yagura.version, yaguraVersion)) {
            throw new VersionMismatchError(`Overlay ${this.name} requires Yagura@${yaguraVersion}, but got ${Yagura.version}`);
        }

        // Deep copy config (this excludes functions!) and deep freeze it
        this.config = deepFreeze(JSON.parse(JSON.stringify(config)));
    }

    /** Called when the app is being initialized */
    public abstract async initialize(): Promise<void>;

    /**
     * Handles incoming events
     *
     * @returns {YaguraEvent} event to be handled by the underlying layers; if null, the handling loop stops for that event
     */
    public abstract async handleEvent(e: YaguraEvent): Promise<YaguraEvent>;

    /**
     * Called whenever an unhandled error is thrown in the app.
     * By default lets Yagura handle the error, so overriding this is recommended
     *
     * @param err
     */
    public async handleError(err: Error) {
        // overriding is optional
        Yagura.handleError(err);
    }

    public toString(): string {
        return `${this.name}`;
    }
}
