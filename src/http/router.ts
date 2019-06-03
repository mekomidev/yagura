import { HttpRequest } from './httpServer.overlay';

export class HttpRouteFormattingError extends Error {}

export type HttpRouteCallback = (event: HttpRequest) => Promise<void>;

export type HttpMethod = 'all' | 'head' | 'get' | 'post' | 'put' | 'delete';

export class HttpRouter {

}

export class HttpRoute {
    public readonly name: string;
    public readonly subroutes: Array<HttpRoute> = new Array<HttpRoute>();

    constructor(name) {
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

        let newRoute;
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

            let newRoute;
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

    public all(cb: HttpRouteCallback) {}
    public get(cb: HttpRouteCallback) {}
    public put(cb: HttpRouteCallback) {}
    public post(cb: HttpRouteCallback) {}
    public delete(cb: HttpRouteCallback) {}

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
        this.get(async (req) => {
            
        });

        // GET one
        this.route(':id').get(async (req) => {

        });

        // POST (create)
        this.post(async (req) => {

        });

        // PUT (update)
        this.put(async (req) => {

        });

        // DELETE one
        this.delete(async (req) => {
            
        });

        return this;
    }
}

// export class ParamRoute extends HttpRoute {

// }

export interface CrudAdapter<D> {
    getAll(query: any): Promise<[D]>;
    get(id: any): Promise<D>;
    create(data: Partial<D>): Promise<D>;
    update(id: any, data: Partial<D>): Promise<D>;
    delete(id: any): Promise<D | void>;
}
