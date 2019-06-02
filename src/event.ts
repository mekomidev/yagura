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
    handleEvent(event: YaguraEvent): void | Promise<void>;
}

export type EventFilter = (event: YaguraEvent) => boolean;
