import { Yagura } from '../..';
import { Logger } from '../../modules/logger.module';

import { HttpRequest } from '../httpServer.overlay';
import { HttpRoute, HttpRouter, HttpMethod, HttpRouteCallback } from '../httpApi.overlay';

import * as path from 'path';
import * as FindMyWay from 'find-my-way';

class FmwRoute<V extends FindMyWay.HTTPVersion = FindMyWay.HTTPVersion.V1> extends HttpRoute {
    private readonly _fmw: FindMyWay.Instance<V>;

    constructor(fmw: FindMyWay.Instance<V>, name: string) {
        super(name);
        this._fmw = fmw;
    }

    public route(subpath: string): FmwRoute<V> {
        return new FmwRoute(this._fmw, path.join(this.path, subpath));
    }

    public method(method: HttpMethod, handler: HttpRouteCallback) {
        const m = method.toUpperCase() as FindMyWay.HTTPMethod;

        this._fmw.off(m, this.path);
        this._fmw.on(m, this.path, handler as any as FindMyWay.Handler<V>);
    }
}

export class FmwRouter<V extends FindMyWay.HTTPVersion = FindMyWay.HTTPVersion.V1> extends HttpRouter {
    private _fmw: FindMyWay.Instance<V>;

    constructor() {
        super();
        this._fmw = FindMyWay();
    }

    public route(routePath: string): HttpRoute {
        return new FmwRoute(this._fmw, routePath);
    }

    public async handle(event: HttpRequest): Promise<boolean> {
        const method = event.req.method;
        const routePath = event.req.path;   // TODO: sanitize path

        const routeResult = this._fmw.find(method as FindMyWay.HTTPMethod, routePath);
        if (!!routeResult && !!routeResult.handler) {
            const handler: HttpRouteCallback = routeResult.handler as any as HttpRouteCallback;     // dangerous!

            try {
                await handler(event);
            } catch (err) {
                (Yagura.getModule('Logger') as Logger).error("[HTTP]".red.bold + ` ${method} ${routePath} responded with an error:\n${err.stack}`);
                await event.sendError(err);
            }

            return true;
        } else {
            return false;
        }
    }

    public prettyPrint(): string {
        return this._fmw.prettyPrint();
    }
}
