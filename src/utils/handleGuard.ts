export class HandleGuard {
    private _handledFlag: boolean = false;
    /** Marks event as handled by Yagura, in order to prevent a possible event handling loop */
    public flagHandled(): void {
        this._handledFlag = true;
    }
    /** Check whether the event has already been handled by Yagura */
    public wasHandled(): boolean {
        return this._handledFlag;
    }
}