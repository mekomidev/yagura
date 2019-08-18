import { Yagura } from '../yagura';
import { Logger } from '../modules/logger.module';
import { HttpRequest } from './httpServer.overlay';

export class HttpRouteFormattingError extends Error {}

export type HttpRouteCallback = (event: HttpRequest) => Promise<void>;

export type HttpMethod = 'all' | 'head' | 'get' | 'post' | 'put' | 'delete';

export class HttpRoute {
    public readonly name: string;
    public readonly subroutes: HttpRoute[] = new Array<HttpRoute>();

    constructor(name: string) {
        this.name = name;
    }

    /**
     * Creates a subroute according to the provided path, and returns its last node
     *
     * @param {string} path subroute path
     *
     * @returns {HttpRoute} last node of the created subroute, corresponding to the given path
     */
    public route(path: string): HttpRoute {
        // Simplest path
        if (path === '/') {
            return this;
        }

        // Check formatting
        if (!path.startsWith('/')) {
            throw new HttpRouteFormattingError("The route path must start with a slash /");
        }

        // Get the next subroute
        const subpaths = path.split('/');
        const nextName = subpaths[1];
        const nextPath = subpaths.splice(1, 1).join('/');

        let newRoute: HttpRoute;
        // TODO: handle wildcards and param routes
        if (!!this.subroutes[nextName]) {
            newRoute = this.subroutes[nextName];
        } else {
            newRoute = new HttpRoute(nextName);
            this.subroutes.push(newRoute);
        }

        return newRoute.route(nextPath);
    }

    /**
     * Given a HTTP request, it calls the relevant callbacks.
     * If a following path is also provided, the handling is forwarded to the appropriate node.
     *
     * @param {HttpRequest} event HTTP request to handle
     * @param {string} path Following route, relative to itself
     *
     * @returns {boolean} whether an appropriate route was found in the tree
     */
    public async handle(event: HttpRequest, path?: string): Promise<boolean> {
        path = path ? path : event.req.path;

        if (path === '/' || path === '') {
            // Method name
            // NOTE: Express does this, figure out why and if it is okay
            let methodName: HttpMethod = event.req.method.toLowerCase() as HttpMethod;
            if (methodName === 'head' && !this._methods.head) {
                methodName = 'get';
            }

            // Method handler
            let methodCallback: HttpRouteCallback;
            if (!!this._methods.all) {
                methodCallback = this._methods.all;
            } else {
                methodCallback = this._methods[methodName];
            }

            if (!!methodCallback) {
                try {
                    await methodCallback(event);
                } catch (err) {
                    // TODO: consider logging here?
                    await event.sendError(err);
                }

                return true;
            } else {
                return false;
            }
        } else {
            // Get the next subroute
            const subpaths = path.split('/');
            const nextName = subpaths[1];
            const nextPath = subpaths.splice(1, 1).join('/');

            let newRoute: HttpRoute;
            // TODO: handle wildcards and param routes
            if (!!this.subroutes[nextName]) {
                newRoute = this.subroutes[nextName];
            } else {
                return false;
            }

            return newRoute.handle(event, nextPath);
        }
    }

    // public param(param: string, validator?: (value: any) => boolean | Error): HttpRoute {
    //     return null;
    // }

    /*
     *  REST/CRUD request handlers
     */

    /** Map of HTTP methods and their respective callbacks */
    private _methods: {[key: string]: HttpRouteCallback};

    /** Assigns a callback to a specified HTTP method on this route */
    public method(name: HttpMethod, cb: HttpRouteCallback) {
        name = name.toLowerCase() as HttpMethod;

        if (!!this._methods[name]) {
            (Yagura.getModule('Logger') as Logger).warn("[HTTP]".green.bold + " method " + name.bold + " is being overridden in HttpRouterOverlay");
        }

        this._methods[name] = cb;
    }

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
        // GET all
        this.get(async (event) => {
            const res = await model.getAll(event.req.query);
            event.res.status(res.code).send(res.data);
        });

        // GET one
        this.route('/:id').get(async (event) => {
            const res = await model.get(event.req.params.id);
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

// export class ParamRoute extends HttpRoute {

// }

/** Boilerplate interface for writing CRUD-structured resource request callbacks */
export interface CrudAdapter<D> {
    getAll(query: any): Promise<CrudResponse<[D]>>;
    get(id: any): Promise<CrudResponse<D>>;
    create(data: Partial<D>): Promise<CrudResponse<D>>;
    update(id: any, data: Partial<D>): Promise<CrudResponse<D>>;
    delete(id: any): Promise<CrudResponse<D | void>>;
}

/** Response interface to be used with CrudAdapter callbacks */
export interface CrudResponse<D> {
    code: number;
    data: D;
}
