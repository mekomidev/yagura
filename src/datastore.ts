import { Model } from "./model";

export abstract class Datastore<I> {

    public abstract getModel<M extends Model<this, I, any>>(name: string): M;
}
