import { Yagura } from '../framework/yagura';
import { eventFilter } from '../framework/event';
import { Overlay } from '../framework/overlay';
import { YaguraError } from '../utils/errors';

import { Logger } from '../modules/logger.module';

import { HttpError, HttpErrorType } from './errors/http.error';
import { HttpServerOverlay, HttpRequest } from './httpServer.overlay';
import { HttpRoute, CrudAdapter } from './router';
import * as SemVer from 'semver';

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
    private _router: HttpRoute;

    constructor(name: string, version: SemVer.SemVer, vendor: string, config: HttpApiConfig, yaguraVersion?: SemVer.Range) {
        super(name, version, vendor, config, yaguraVersion);

        try {
            this._router = new HttpRoute('');
            this.declareRoutes(this._router);
        } catch (err) {
            throw new YaguraError(`Failed to set up HTTP router:\n${err.message}`);
        }
    }

    /**
     * Given a base router, declare all routes and their respective method handlers
     *
     * @param {HttpRoute} router base router to attach the routes and method callbacks to
     */
    public abstract declareRoutes(router: HttpRoute): void;

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
