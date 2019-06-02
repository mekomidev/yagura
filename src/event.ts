import { Yagura } from "./yagura";
import { deepFreeze } from "./utils/objectUtils";
import { HandleGuard } from "./utils/handleGuard";

export abstract class YaguraEvent {
    protected data: any;

    constructor(data: any) {
        this.data = data;
    }

    public readonly guard: HandleGuard = new HandleGuard();
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
 * Use this in your Overlay to reduce event processing overhead.
 * 
 * Example: "@eventFilter(HttpRequestEvent)" on handleEvent() of a HttpRouterOverlay
 * 
 * @param {(typeof YaguraEvent)[] | EventFilter} filter 
 */
export function eventFilter(filter: (typeof YaguraEvent)[] | EventFilter) {
    if(filter instanceof Array) {
        const allowedEvents: Array<typeof YaguraEvent> = filter;

        return function(target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
            const original = descriptor.value;
            descriptor.value = function() {
                const context = this;
                const args = arguments;

                // Call filter
                if(allowedEvents.find((eventType: typeof YaguraEvent) => { return args[0].constructor.name === eventType.name })) {
                    original.apply(context, args);
                }
            }
        }
    } else if(filter instanceof Function) {
        const eventFilter: EventFilter = filter;
        return function(target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
            const original = descriptor.value;
            descriptor.value = function() {
                const context = this;
                const args = arguments;

                // Call filter
                if(eventFilter(args[0])) {
                    original.apply(context, args);
                }
            }
        }
    }
}