import { deepFreeze } from './utils/objectUtils';
import { YaguraEvent, EventHandler, EventFilter } from './event';
import { Yagura } from './yagura';

export interface OverlayConfig {
    name: string;
    version: string;
    vendor: string;
    yaguraVersion?: string;

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
        return `${this.config.vendor}#${this.config.name} (${this.config.version})`;
    }
}
