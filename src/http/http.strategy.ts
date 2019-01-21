import { YaguraEvent, EventStrategy } from "../event";
import { Yagura } from "..";
import { Logger } from "../modules/logger.module";
import { ApiError } from './apiError';

import * as http from 'http';
import { Express as ExpressApp } from 'express';
import * as express from 'express';

export interface HttpStrategyConfig {
    port: number;
}

export class HttpStrategy extends EventStrategy<HttpRequest> {
    protected readonly _config: HttpStrategyConfig;

    private logger: Logger;
    private _express: ExpressApp;

    constructor(config: HttpStrategyConfig) {
        super(config);
    }

    public async start(httpPort?: number) {
        if (this._express) {
            throw new Error('This strategy has already been started');
        }

        const port: number = httpPort || parseInt(process.env.PORT, 10) || this._config.port;

        // Initialize Express and attach middleware
        const app: ExpressApp = express();
        require('express-async-errors');
        // authentication

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
}

export interface HttpEventData {
    // Request metadata
    // Incoming data
    body: any;
    params: any;
    query: any;
    headers: any;

    raw: http.ClientRequest;
}

export class HttpRequest extends YaguraEvent implements HttpEventData {
    protected readonly data: HttpEventData;

    // Incoming data
    public body: any;
    public params: any;
    public query: any;
    public headers: any;

    public raw: http.ClientRequest;

    constructor(data: HttpEventData) {
        super(data);
        Object.assign(this, this.data);
    }

    // Response methods
}
