export class HandleGuard {
    private _handledFlag: boolean = false;
    /** Marks entity as handled by Yagura, in order to prevent a possible event handling loop */
    public flagHandled(): void {
        this._handledFlag = true;
    }
    /** Check whether the entity has already been handled by Yagura */
    public get wasHandled(): boolean {
        return this._handledFlag;
    }
}
