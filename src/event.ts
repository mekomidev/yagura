import { Yagura } from ".";
import { deepFreeze } from "./utils/objectUtils";

export abstract class YaguraEvent {
    protected data: any;

    constructor(data: any) {
        this.data = data;
    }
}

export interface EventHandler<E extends YaguraEvent> {
    handleEvent(event: E): void | Promise<void>;
}

export type EventFilter = (event: YaguraEvent) => boolean;

export abstract class EventStrategy<E extends YaguraEvent> implements EventHandler<E> {
    protected readonly _config: any;

    public constructor(config: any) {
        this._config = deepFreeze(config);
    }

    public abstract async start(): Promise<void>;
    public handleEvent(event: E): void {
        Yagura.handleEvent(event);
    }
}