import { deepFreeze } from './utils/objectUtils';
import { YaguraEvent, EventHandler, EventFilter } from './event';

export interface OverlayConfig {
    name: string;
    version: string;
    vendor: string;
    yaguraVersion?: string;

    strategy: any;
    overlay: any;
}

export abstract class Overlay implements EventHandler {
    public readonly config: OverlayConfig;

    /**
     * Initializes the Overlay
     *
     * @param {OverlayConfig} config Overlay configuration object. Should be a plain JSON object, any functions will be excluded
     */
    constructor(config: OverlayConfig) {
        // Deep copy config (this excludes functions!) and deep freeze it
        this.config = deepFreeze(JSON.parse(JSON.stringify(config)));
    }

    /** Handles incoming events */
    public abstract async handleEvent(e: YaguraEvent): Promise<void>;

    /**
     * Called whenever an unhandled error is thrown in the app
     *
     * @param err
     */
    public async handleError(err: Error) {
        // overriding is optional
    }
}
