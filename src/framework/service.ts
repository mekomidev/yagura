
import { Config, Yagura } from './yagura';
import { YaguraError } from '../utils/errors';
import { deepFreeze } from '../utils/objectUtils';

export interface Service {
    /** Called when the Service is being registered */
    onInitialize?(): Promise<void>;
}

export abstract class Service {
    public readonly vendor: string;
    public readonly name: string;
    public readonly config: Config;

    constructor(name: string, vendor: string, config?: Config) {
        this.vendor = vendor;
        this.name = name;
        if(!!config) this.config = deepFreeze(JSON.parse(JSON.stringify(config)));
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
