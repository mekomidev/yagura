import { Yagura } from '../framework/yagura';
import { eventFilter } from '../framework/event';
import { Overlay } from '../framework/overlay';
import { YaguraError } from '../utils/errors';

import { Logger } from '../modules/logger.module';

import { HttpError, HttpErrorType } from './errors/http.error';
import { HttpRequest, HttpRouter } from './http';

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
    public readonly config: HttpApiConfig;

    private _router: HttpRouter;

    constructor(name: string, config: HttpApiConfig, yaguraVersion?: SemVer.Range) {
        super(name, config, yaguraVersion);

        try {
            // TODO: decouple FmwRouter from here, set as default, but allow specifying a custom router
            this._router = new FmwRouter();
            this.declareRoutes(this._router);

            if (process.env.NODE_ENV !== 'production') {
                (Yagura.getModule('Logger') as Logger).debug("[HTTP]".green.bold + ` routes declared;\n` + this._router.prettyPrint().dim);
            }
        } catch (err) {
            throw err;
            // throw new YaguraError(`Failed to set up HTTP router:\n${err.message}`);
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

        if (this.config.options.debugTime) {
            const time = endTime - startTime;
            (Yagura.getModule('Logger') as Logger).verbose("[HTTP]".green.bold + ` ${event.req.method.toUpperCase().bold} ${event.req.path} ` + `[${time}ms]`.dim);
        }

        // Pass HTTP event further down if not handled
        return handled ? null : event;
    }
}
