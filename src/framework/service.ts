
import { Yagura } from './yagura';
import { YaguraError } from '../utils/errors';
export abstract class Service {
    public readonly vendor: string;
    public readonly name: string;

    constructor(name: string, vendor: string) {
        this.vendor = vendor;
        this.name = name;
    }

    protected yagura: Yagura;

    public mount(instance: Yagura): void {
        if (!this.yagura) {
            this.yagura = instance;
        } else {
            throw new YaguraError('This layer has already been mounted');
        }
    }

    /** Called when the Service is being initialized, usually during its registration */
    public abstract initialize(): Promise<void>;
}
