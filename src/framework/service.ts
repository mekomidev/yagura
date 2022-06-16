
import { Yagura } from './yagura';
import { YaguraError } from '../utils/errors';

export interface Service {
    /** Called when the Service is being registered */
    onInitialize?(): Promise<void>;
}

export abstract class Service {
    public readonly vendor: string;
    public readonly name: string;

    constructor(name: string, vendor: string) {
        this.vendor = vendor;
        this.name = name;
    }

    protected yagura: Yagura;

    public async initialize(instance: Yagura): Promise<void> {
        if (!this.yagura) {
            this.yagura = instance;
            if(this.onInitialize) await this.onInitialize();
        } else {
            throw new YaguraError('This layer has already been mounted');
        }
    }
}
