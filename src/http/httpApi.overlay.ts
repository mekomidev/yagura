import { Yagura } from '../framework/yagura';
import { eventFilter } from '../framework/event';
import { Overlay } from '../framework/overlay';
import { YaguraError } from '../utils/errors';

import { Logger } from '../modules/logger.module';

import { HttpError, HttpErrorType } from './errors/http.error';
import { HttpRequest } from './httpServer.overlay';

import * as SemVer from 'semver';
import { FmwRouter } from './routers/fmw.router';

export interface HttpApiConfig {
    options: {
        debugTime: boolean;
    };
}

/**
 * Abstract HTTP router definition.
 *
 * In a Yagura application with a HttpServerOverlay mounted,
 * the HttpApiOverlay (mounted afterwards) receives the HTTP requests
 * and routes them per user's definition.
 */
export abstract class HttpApiOverlay extends Overlay {
    private _router: HttpRouter;

    constructor(name: string, version: SemVer.SemVer, vendor: string, config: HttpApiConfig, yaguraVersion?: SemVer.Range) {
        super(name, version, vendor, config, yaguraVersion);

        try {
            // TODO: decouple FmwRouter from here, set as default, but allow specifying a custom router
            this._router = new FmwRouter();
            this.declareRoutes(this._router);

            if (process.env.NODE_ENV !== 'production') {
                (Yagura.getModule('Logger') as Logger).debug("[HTTP]".green.bold + ` routes declared;\n` + this._router.prettyPrint().dim);
            }
        } catch (err) {
            throw new YaguraError(`Failed to set up HTTP router:\n${err.message}`);
        }
    }

    /**
     * Given a base router, declare all routes and their respective method handlers
     *
     * @param {HttpRoute} router base router to attach the routes and method callbacks to
     */
    public abstract declareRoutes(router: HttpRouter): void;

    @eventFilter([HttpRequest])
    public async handleEvent(event: HttpRequest): Promise<HttpRequest> {
        const startTime = Date.now();
        const handled: boolean = await this._router.handle(event);
        const endTime = Date.now();

        if (this.config.overlay.options.debugTime) {
            const time = endTime - startTime;
            (Yagura.getModule('Logger') as Logger).verbose("[HTTP]".green.bold + ` ${event.req.method.toUpperCase().bold} ${event.req.path} ` + `[${time}ms]`.dim);
        }

        // Pass HTTP event further down if not handled
        return handled ? null : event;
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
