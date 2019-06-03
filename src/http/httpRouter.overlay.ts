import { Yagura } from '../yagura';
import { eventFilter } from '../event';
import { Overlay, OverlayConfig } from '../overlay';
import { YaguraError } from '../utils/errors';

import { Logger } from '../modules/logger.module';

import { ApiError, ApiErrorType } from './apiError';
import { HttpServerOverlay, HttpRequest } from './httpServer.overlay';
import { HttpRoute, CrudAdapter, HttpRouter } from './router';

export interface HttpRouterOverlayConfig extends OverlayConfig {
    overlay: HttpRouterConfig;
}

export interface HttpRouterConfig {
    options: {
        debugTime: boolean;
    };
}

/**
 * Abstract HTTP router definition.
 *
 * In a Yagura application with a HttpServerOverlay mounted low,
 * the HttpRouterOverlay (mounted above it) receives the HTTP requests
 * and routes them per user's definition.
 */
export abstract class HttpRouterOverlay extends Overlay {
    private _router: HttpRoute;

    constructor(config: OverlayConfig) {
        super(config);

        try {
            this._router = new HttpRoute('');
            this.declareRoutes(this._router);
        } catch (err) {
            throw new YaguraError(`Failed to set up HTTP router:\n${err.message}`);
        }
    }

    /**
     * Override this in order to declare the desired HTTP routes
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
            (Yagura.getModule('Logger') as Logger).verbose(`${event.req.method.toUpperCase().bold} ${event.req.path}` + `[${time}ms]`.dim);
        }

        // Pass HTTP event further down if not handled
        return handled ? null : event;
    }
}