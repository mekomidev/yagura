import { Model } from '../model';
import { HttpRequest } from './http.strategy';

export type HttpRouteCallback = (event: HttpRequest) => Promise<void>;

export class HttpRouter {

}

export class HttpRoute {
    public readonly name: string;

    constructor(name: string) {
        this.name = name;
    }

    public route(route: string): HttpRoute {
        let newRoute: HttpRoute;

        if (route.indexOf('/') >= 0) {
            newRoute = this._buildRoute(route);
        } else {
            newRoute = new HttpRoute(route);
        }

        return newRoute;
    }

    public param(param: string, validator?: (value: any) => boolean | Error): HttpRoute {
        return null;
    }

    private _buildRoute(path: string): HttpRoute {
        // if (path.indexOf('/') === 0) {
        //     path = path.substring(1);
        // }

        // if (path.indexOf(':') === 0) {
        //     // 
        // } else {
            
        // }

        return null;
    }

    /*
     *  REST/CRUD request handlers
     */

    public all(cb: HttpRouteCallback) {}
    public get(cb: HttpRouteCallback) {}
    public put(cb: HttpRouteCallback) {}
    public post(cb: HttpRouteCallback) {}
    public delete(cb: HttpRouteCallback) {}

    /**
     * Mount the Model on current route and attach CRUD handlers/subroutes
     * All error handling is taken care of according to HTTP REST API standards
     *
     * Example:
     *  GET .../        => model.getAll(query);
     *  GET .../id      => model.get(id);
     *  POST .../       => model.create(data);
     *  PUT .../id      => model.update(id, data);
     *  DELETE .../id   => model.delete(id);
     *
     * @param {Model} model Model to mount as CRUD resource
     */
    public model(model: Model): HttpRoute {
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

export class ParamRoute extends HttpRoute {

}
