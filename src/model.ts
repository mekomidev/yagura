import { Logger } from "./modules/logger.module";
import { Datastore } from "./datastore";

export abstract class Model<DS extends Datastore<any>, I, D> {
    public readonly name: string;
    private readonly _ds: DS;

    constructor(name: string, datastore: DS) {
        this.name = name;
        this._ds = datastore;
    }

    public abstract async query();

    public abstract async create(data: any): Promise<ModelInstance<DS, I, D> & D>;
    public abstract async save(instance: ModelInstance<DS, I, D> & D);
    public abstract update(id: I, data: any): ModelInstance<DS,I,D> & D;
    public abstract async delete(instance: ModelInstance<DS, I, D> & D);

    /*
     * Static per-model initializers
     */
    private readonly _actions: {[name: string]: ModelAction<DS>} = {};

    public setAction(name: string, action: ModelAction<DS>): void {
        if (!!this._actions[name]) {
            throw new Error(`Action '${name}' `);
        } else {
            this._actions[name] = action;
        }
    }
}

export abstract class ModelInstance<DS extends Datastore<any>, I, D> {
    public readonly id: I;
    public readonly model: Model<DS, I, D>;

    constructor(model: Model<DS, I, D>, id: I, data: D) {
        this.model = model;
        this.id = id;
        Object.assign(this, data);
    }

    public abstract async save();
    public abstract async delete();

    public abstract serialize(): D;
}

export abstract class ModelAction<DS extends Datastore<any>> {

    //public abstract async execute(): Promise<ModelInstance<DS, any, any> | [ModelInstance<DS>] | void>;
}

//  EXAMPLE of implementation
//
// class SqlDatastore extends Datastore {};
// class SqlModel extends Model<SqlDatastore, number> {};

// interface ExampleData {
//     lol: string;
// }

// class SqlModelInstance extends ModelInstance<SqlDatastore, number, ExampleData> implements ExampleData {}

// let exampleInstance: SqlModelInstance;
// exampleInstance.lol;


//     private readonly logger: Logger;

//     constructor() {}

//     public abstract parse(req: express.Request): any;
//     public abstract async validate(req, query);
//     public abstract async fetch(req, query): Promise<any>;
//     public abstract async process(req, data): Promise<any>;



//     public async execute(req: express.Request, res: express.Response) {
//         const reqName: string = `${req.method} ${req.originalUrl.split("?").shift()}`;

//         let data, query;
//         try {
//             // Parse
//             try { query = this.parse(req); }
//             catch (err) {
//                 if(err instanceof ResourceError) throw err;
                
//                 logger.error(`Failed to parse data for ${reqName}`);
//                 logger.error(err);
//                 logger.verbose(query);
//                 throw new ResourceError(500);
//             }

//             // Validate
//             try { await this.validate(req, query) }
//             catch (err) {
//                 if(err instanceof ResourceError) throw err;

//                 logger.debug(`Failed to validate ${reqName}`);
//                 logger.debug(err);
//                 logger.verbose(query);
//                 throw new ResourceError(400);
//             }

//             // Fetch
//             try {
//                 data = await this.fetch(req, query);
//                 if(typeof data === 'undefined')
//                     throw new ResourceError(404);
//             } catch (err) {
//                 if(err instanceof ResourceError) throw err;
                
//                 logger.error(`Failed to fetch data for ${reqName}`);
//                 logger.error(err);
//                 logger.verbose(query);
//                 logger.verbose(data);
//                 throw new ResourceError(500);
//             }

//             // Process
//             try {
//                 data = await this.process(req, data);
//             } catch (err) {
//                 if(err instanceof ResourceError) throw err;
                
//                 logger.error(`Failed to fetch data for ${reqName}`);
//                 logger.error(err);
//                 logger.verbose(data);
//                 throw new ResourceError(500);
//             }

//             // Sanitize
//             try {
//                 data = this.sanitize(data);
//             } catch (err) {
//                 if(err instanceof ResourceError) throw err;
                
//                 logger.error(`Failed to sanitize data for ${reqName}`);
//                 logger.error(err);
//                 logger.verbose(data);
//                 throw new ResourceError(500);
//             }

//             // Respond
//             try {
//                 this.respond(req, res, data);
//             } catch (err) {
//                 if(err instanceof ResourceError) throw err;
                
//                 logger.error(`Failed to sanitize data for ${reqName}`);
//                 logger.error(err);
//                 logger.verbose(data);
//                 throw new ResourceError(500);
//             }

//             // After
//             try {
//                 await this.after(req, data);
//             } catch (err) {
//                 logger.error(`Failed to execute 'after' event for ${reqName}`);
//                 logger.error(err);
//             }
//         } catch (err) {
//             if(err instanceof ResourceError) {
//                 res.status(err.resStatus).send(err.resBody);
//             } else {
//                 logger.error(`Failed to process request ${reqName}`);
//                 logger.error(err);
//                 logger.verbose(data);
//                 throw new ResourceError(500);
//             }
//         }

//     }
// }
