import { deepFreeze } from '../utils/objectUtils';
import { YaguraError } from '../utils/errors';
import { YaguraEvent, EventHandler, EventFilter } from './event';
import { Yagura } from './yagura';

export abstract class Layer implements EventHandler {
    public readonly name: string;

    public readonly config: any;

    /**
     * Initializes the Layer
     *
     * @param {any} config Layer configuration object. Should be a plain JSON object, any functions will be excluded
     */
    constructor(name: string, config: any) {
        this.name = name;

        // Deep copy config (this excludes functions!) and deep freeze it
        // TODO: review whether this is necessary
        this.config = deepFreeze(JSON.parse(JSON.stringify(config)));
    }

    protected yagura: Yagura;

    public mount(instance: Yagura): void {
        if (!this.yagura) {
            this.yagura = instance;
        } else {
            throw new YaguraError('This overlay has already been mounted');
        }
    }

    /** Called when the app is being initialized */
    public abstract initialize(): Promise<void>;

    /**
     * Handles incoming events
     *
     * @returns {YaguraEvent} event to be handled by the underlying layers; if null, the handling loop stops for that event
     */
    public abstract handleEvent(e: YaguraEvent): Promise<YaguraEvent>;

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