import { YaguraEvent } from './event';

export enum AppEventType {
    start, shutdown, restart, reload, forceShutdown
}

export class AppEvent extends YaguraEvent {
    public data: AppEventType;

    constructor(type: AppEventType) {
        super(type);
    }
}
