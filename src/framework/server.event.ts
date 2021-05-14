import { YaguraEvent } from './event';

export enum ServerEventType {
    start, shutdown, restart, reload, forceShutdown
}

export class ServerEvent extends YaguraEvent {
    public data: ServerEventType;

    constructor(type: ServerEventType) {
        super(type);
    }
}
