
export abstract class Module {
    public readonly vendor: string;
    public readonly name: string;

    constructor(vendor: string, name: string) {
        this.vendor = vendor;
        this.name = name;
    }
}
