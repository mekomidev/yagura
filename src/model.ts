import { Logger } from "./modules/logger.module";
import * as express from 'express';

export abstract class Model {

    /** Returns JSON-formatted serialized instance of the model */
    public abstract serialize(): any;

    /** This is to be potentially called by a constructor/setter */
    public abstract deserialize(json: any): void;

    /**  */
    public abstract sanitize(): this;

    /*
     * Static per-model initializers
     */
    private static readonly _actions: {[name: string]: typeof ModelAction} = {};

    public static setAction(name: string, action: typeof ModelAction): void {
        if (!!this._actions[name]) {
            throw new Error(`Action '${name}' `);
        } else {
            this._actions[name] = action;
        }
    }
}

export class ModelInstance {}

export abstract class ModelAction<M extends Model> {
}
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
