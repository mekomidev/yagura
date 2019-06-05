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

    public route(path: string): HttpRoute {
        // Simplest path
        if (path === '/') {
            return this;
        }

        // Check if starts with /
        if (!path.startsWith('/')) {
            throw new HttpRouteFormattingError();
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
                await methodCallback(event);
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
    private _methods: {[key: string]: HttpRouteCallback};

    /** Assigns a callback to a specified HTTP method on this route */
    public method(name: HttpMethod, cb: HttpRouteCallback) {
        name = name.toLowerCase() as HttpMethod;

        if (!!this._methods[name]) {
            (Yagura.getModule('Logger') as Logger).debug("[HTTP]".green.bold + " method " + name.bold + " is being overridden in HttpRouterOverlay");
        }

        this._methods[name] = cb;
    }

    public all(cb: HttpRouteCallback) { this.method('all', cb); }
    public get(cb: HttpRouteCallback) { this.method('get', cb); }
    public put(cb: HttpRouteCallback) { this.method('put', cb); }
    public post(cb: HttpRouteCallback) { this.method('post', cb); }
    public delete(cb: HttpRouteCallback) { this.method('delete', cb); }

    /**
     * Mount a model with CrudAdapter on current route and attach CRUD handlers/subroutes
     * All error handling is taken care of according to HTTP REST API standards
     *
     * Example:
     *  GET .../        => model.getAll(query);
     *  GET .../id      => model.get(id);
     *  POST .../       => model.create(data);
     *  PUT .../id      => model.update(id, data);
     *  DELETE .../id   => model.delete(id);
     *
     * @param {CrudAdapter} model a model to mount as CRUD resource
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
