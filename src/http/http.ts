import { YaguraEvent } from "../framework/event";
import { HttpError, HttpErrorType } from './errors/http.error';

import { Response, Request } from 'express';

export interface HttpEventData {
    req: Request;
    res: Response;
}

/**
 * A [YaguraEvent] subclass representing a HTTP request.
 * Incapsules [req] and [res] objects in order to pass them through the overlay stack.
 */
export class HttpRequest extends YaguraEvent implements HttpEventData {
    protected readonly data: HttpEventData;

    // Incoming data
    public readonly req: Request;
    public readonly res: Response;

    constructor(data: HttpEventData) {
        super(data);
        this.req = data.req;
        this.res = data.res;
    }

    // Response methods
    /**
     * Send a response to this [HttpRequest]
     *
     * @param {Number} status HTTP status code to respond with
     * @param {any} data HTTP response body contents
     */
    public async send(status: number, data?: any): Promise<Response> {
        this.res.status(status).send(data).end();
        return this.res;
    }

    /**
     * Send a response to this [HttpRequest] based on an [Error]
     *
     * @param {Error} err The error to be parsed into a response
     */
    public async sendError(err: Error): Promise<Response> {
        if (err instanceof HttpError) {
            this.res.status(err.type.code).send(err.type.type).end();
        } else {
            // TODO: consider not sending the stack when in productioj
            this.res.status(500).send(err.stack).end();
        }

        return this.res;
    }
}

/*
 *      HTTP routing stuff
 */

export class HttpRouteFormattingError extends Error {}

export type HttpRouteCallback = (event: HttpRequest) => Promise<void>;

export type HttpMethod = 'all' | 'head' | 'get' | 'post' | 'put' | 'delete';

export abstract class HttpRoute {
    /** Path relative to the route this route is mounted on */
    public readonly path: string;

    constructor(name: string) {
        this.path = name;
    }

    public abstract route(subpath: string): HttpRoute;

    /*
     *  REST/CRUD request handlers
     */

    /** Assigns a callback to a specified HTTP method on this route */
    public abstract method(method: HttpMethod, handler: HttpRouteCallback): void;
    /** Attaches a callback to all HTTP methods on this route */
    public all(cb: HttpRouteCallback) { this.method('all', cb); }
    /** Attaches a callback to the HTTP GET method on this route */
    public get(cb: HttpRouteCallback) { this.method('get', cb); }
    /** Attaches a callback to the HTTP PUT method on this route */
    public put(cb: HttpRouteCallback) { this.method('put', cb); }
    /** Attaches a callback to the HTTP POST method on this route */
    public post(cb: HttpRouteCallback) { this.method('post', cb); }
    /** Attaches a callback to the HTTP DELETE method on this route */
    public delete(cb: HttpRouteCallback) { this.method('delete', cb); }

    /**
     * Mounts a model with CrudAdapter on current route and attaches CRUD handlers to HTTP methods and relevant subroutes.
     * All error handling should be taken care of according to HTTP REST API standards.
     *
     * Example:
     *  GET .../        => model.getAll(query);
     *  GET .../id      => model.get(id);
     *  POST .../       => model.create(data);
     *  PUT .../id      => model.update(id, data);
     *  DELETE .../id   => model.delete(id);
     *
     * @param {CrudAdapter} model a CRUD model adapter to mount as a resource
     *
     * @returns itself, for chaining
     */
    public model<D>(model: CrudAdapter<D>): HttpRoute {
        // GET many
        this.get(async (event: HttpRequest) => {
            const res = await model.getMany(event.req.query);
            event.res.status(res.code).send(res.data);
        });

        // GET one
        this.route('/:id').get(async (event: HttpRequest) => {
            const res = await model.getOne(event.req.params.id);
            event.res.status(res.code).send(res.data);
        });

        // POST (create)
        this.post(async (event) => {
            const res = await model.create(event.req.body);
            event.res.status(res.code).send(res.data);
        });

        // PUT (update)
        this.route('/:id').put(async (event) => {
            const res = await model.update(event.req.params.id, event.req.query);
            event.res.status(res.code).send(res.data);
        });

        // DELETE one
        this.route('/:id').delete(async (event) => {
            const res = await model.delete(event.req.params.id);
            event.res.status(res.code).send(res.data);
        });

        return this;
    }
}

export abstract class HttpRouter {
    /**
     * Creates a subroute according to the provided path, and returns its last node
     *
     * @param {string} path subroute path
     *
     * @returns {HttpRoute} last node of the created subroute, corresponding to the given path
     */
    public abstract route(routePath: string): HttpRoute;

    /**
     * Given a HTTP request, it calls the relevant callbacks.
     *
     * @param {HttpRequest} event HTTP request to handle
     *
     * @returns {boolean} whether an appropriate route was found in the tree
     */
    public abstract async handle(event: HttpRequest): Promise<boolean>;

    public abstract prettyPrint(): string;
}

// export class ParamRoute extends HttpRoute {

// }

/** Boilerplate interface for writing CRUD-structured resource request callbacks */
export interface CrudAdapter<D> {
    getMany(query: any): Promise<CrudResponse<[D]>>;
    getOne(id: any): Promise<CrudResponse<D>>;
    create(data: Partial<D>): Promise<CrudResponse<D>>;
    update(id: any, data: Partial<D>): Promise<CrudResponse<D>>;
    delete(id: any): Promise<CrudResponse<D | void>>;
}

/** Response interface to be used with CrudAdapter callbacks */
// TODO: consider eliminating this
export interface CrudResponse<D> {
    code?: number;
    data: D;
}
