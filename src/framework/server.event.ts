import { YaguraEvent } from './event';

export enum ServerEventType {
    start, shutdown, restart, reload, forceShutdown
}

export class ServerEvent extends YaguraEvent {
    public readonly type: ServerEventType;

    constructor(type: ServerEventType) {
        super();

        this.type = type;
    }
}
