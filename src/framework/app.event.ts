import { Event } from './event';

export enum AppEventType {
    start, shutdown, restart, reload, forceShutdown
}

export class AppEvent extends Event {
    public data: AppEventType;

    constructor(type: AppEventType) {
        super(type);
    }
}
