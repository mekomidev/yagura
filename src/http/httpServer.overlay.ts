import { YaguraEvent, eventFilter } from "../event";
import { Yagura } from "../yagura";
import { Overlay, OverlayConfig } from "../overlay";
import { Logger } from "../modules/logger.module";
import { ApiError, ApiErrorType } from './apiError';

import * as http from 'http';
import { Express as ExpressApp, Response, Request } from 'express';
import * as express from 'express';
import { RequestHandler } from "express-serve-static-core";

export interface HttpOverlayConfig extends OverlayConfig {
    overlay: HttpServerConfig;
}

export interface HttpServerConfig {
    port: number;
    errorCodes?: [ApiErrorType];
    defaultError: string | number;
}

export class HttpServerOverlay extends Overlay {
    public readonly config: HttpOverlayConfig;

    private logger: Logger;
    private _express: ExpressApp;
    private _expressMiddleware: [() => RequestHandler];

    constructor(config: HttpOverlayConfig, middleware: [() => RequestHandler]) {
        super(config);
        this._expressMiddleware = middleware;

        // Initialize all defined error types
        if (this.config.overlay.errorCodes && this.config.overlay.errorCodes.length > 0) {
            this.config.overlay.errorCodes.forEach((errorCode) => {
                ApiError.addType(errorCode);
            });
        }
    }

    public async initialize() {
        if (this._express) {
            throw new Error('This strategy has already been started');
        }

        const port: number = parseInt(process.env.HTTP_PORT, 10) || this.config.overlay.port;

        // Initialize Express
        const app: ExpressApp = express();
        // Attach middleware
        require('express-async-errors');
        for (const m of this._expressMiddleware) {
            app.use(m());
        }

        // Pass events to Yagura
        app.use((req, res) => {
            Yagura.handleEvent(new HttpRequest({ req, res }));
        });

        // Set up error handling
        app.use(async (err: Error, req: express.Request, res: express.Response, next: () => void) => {
            this.logger.error('[HTTP] UNHANDLED ERROR caught');
            this.logger.error(err);

            if (!res.headersSent) {
                if (err instanceof ApiError) {
                    const apiError: ApiError = err as ApiError;
                    // apiError.sendResponse(res);
                } else {
                    res.sendStatus(500);
                }
            } else {
                this.logger.error('\nCould not notify client about internal error, headers already sent');
            }

            res.end();

            // Calls Overlay's error handler
            try {
                await Yagura.handleError(err);
            } catch {
                // ...but carefully, never trust devs, what if THAT crashes?
                this.logger.error(`Yo, seriously?`);
            }
        });

        // Start server
        this._express = app;
        await new Promise((resolve, reject) => {
            this._express.listen(port, () => {
                // this.logger.info(`Server listening on`.green + `port ${port}`.bold);
                resolve();
            });
        });
    }

    @eventFilter([HttpRequest])
    public async handleEvent(event: HttpRequest): Promise<YaguraEvent> {
        // Default response
        (new ApiError(this.config.overlay.defaultError)).sendResponse(event.res);

        // Always return null
        return null;
    }
}

export interface HttpEventData {
    req: Request;
    res: Response;
}

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
}
