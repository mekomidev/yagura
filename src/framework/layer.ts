import { deepFreeze } from '../utils/objectUtils';
import { YaguraError } from '../utils/errors';
import { Event, EventHandler } from './event';
import { Config, Yagura } from './yagura';

export interface Layer {
    /** Called when the app is being initialized */
    onInitialize?(): Promise<void>;
}

export abstract class Layer implements EventHandler {
    public readonly name: string;
    public readonly config: Config;

    /**
     * Initializes the Layer
     *
     * @param {any} config Layer configuration object. Should be a plain JSON object, any functions will be excluded
     */
    constructor(config?: Config) {
        // Deep copy config (this excludes functions!) and deep freeze it
        if(!!config) this.config = deepFreeze(JSON.parse(JSON.stringify(config)));
    }

    protected yagura: Yagura;

    public async initialize(instance: Yagura): Promise<void> {
        if (!this.yagura) {
            this.yagura = instance;
            if(this.onInitialize) await this.onInitialize();
        } else {
            throw new YaguraError('This layer has already been mounted');
        }
    }

    /**
     * Handles incoming events
     *
     * @returns {Event} event to be handled by the underlying layers; if null, the handling loop stops for that event
     */
    public abstract handleEvent(e: Event): Promise<Event>;

    /**
     * Called whenever an unhandled error is thrown in the app.
     * By default lets Yagura handle the error, so overriding this is recommended
     *
     * @param err
     */
    public async handleError(err: Error): Promise<void> {
        // overriding is optional
        await this.yagura.handleError(err);
    }

    public toString(): string {
        return `${this.name}`;
    }
}
