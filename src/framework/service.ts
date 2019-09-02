
export abstract class Service {
    public readonly vendor: string;
    public readonly name: string;

    constructor(name: string, vendor: string) {
        this.vendor = vendor;
        this.name = name;
    }
}
