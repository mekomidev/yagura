import { HandleGuard } from "../utils/handleGuard";
import { createHash, randomBytes } from "crypto";
import { YaguraError } from "..";

export abstract class YaguraEvent {
    public readonly id: string;
    public data: any;

    /**
     * @param data data to be held by this Event
     * @param id unique ID for this Event; if not provided, a random 32-byte hex string is generated
     */
    constructor(data: any, id?: string) {
        this.data = data;
        this.id = id ?? randomBytes(32).toString('hex');
    }

    /** Called when the event is being consumed. Stub, override */
    protected onConsumed(): Promise<void> { return new Promise((resolve) => resolve()); }

    /**
     * Signals event consumption, locking it from further consumption.
     * Do not override.
     */
    public async consume(): Promise<void> {
        if(!this.wasConsumed) {
            this.guard.flagHandled();
            await this.onConsumed();
        } else {
            throw new YaguraError(`${this.constructor.name}#${this.id} event consumed multiple times`);
        }
    }

    public get wasConsumed() {
        return this.guard.wasHandled;
    }

    /** @returns a SHA256 hash of the @member data member */
    public getHash(): string {
        return createHash('sha256').update((this.data as object).toString()).digest('hex');
    }

    public toString(): string {
        return `${this.constructor.name}#${this.id}\n${JSON.stringify(this.data)}`;
    }

    protected readonly guard: HandleGuard = new HandleGuard();
}

export interface EventHandler {
    handleEvent(event: YaguraEvent): YaguraEvent | Promise<YaguraEvent>;
}

/**
 * Event filter utility type;
 * To be used with the "@eventFilter" decorator
 */
export type EventFilter = (event: YaguraEvent) => boolean;

/**
 * Event filtering decorator factory;
 * Given an array of YaguraEvent subclasses or a EventFilter function,
 * allows the decorated method to handle only the allowed events.
 *
 * Use this in your Layer to reduce event processing overhead.
 *
 * Example: "@eventFilter(HttpRequestEvent)" on handleEvent() of a HttpRouterLayer
 *
 * @param {(typeof YaguraEvent)[] | EventFilter} filter
 */
export function eventFilter(filter: typeof YaguraEvent[] | EventFilter) {
    if (filter instanceof Array) {
        const allowedEvents: typeof YaguraEvent[] = filter;

        return function(target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<(... params: any[])=> Promise<YaguraEvent>>) {
            const original = descriptor.value;
            descriptor.value = async function() {
                const context = this;
                const args = arguments;

                // Call filter
                if (allowedEvents.find((eventType: typeof YaguraEvent) => args[0].constructor.name === eventType.name )) {
                    return await original.apply(context, args);
                } else {
                    return null;
                }
            };
        };
    } else if (filter instanceof Function) {
        const filterFunction: EventFilter = filter;
        return function(target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<(... params: any[])=> Promise<YaguraEvent>>) {
            const original = descriptor.value;
            descriptor.value = async function() {
                const context = this;
                const args = arguments;

                // Call filter
                if (filterFunction(args[0] as YaguraEvent)) {
                    return await original.apply(context, args);
                } else {
                    return null;
                }
            };
        };
    }
}
