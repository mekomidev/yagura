import { Response } from 'express';

export interface HttpErrorType {
    code: number;
    type: string;
    message?: string;
}

/** Error to be thrown for HTTP API responses */
export class HttpError extends Error {
    /*
     *  Static members
     */

    public static addType(errorType: HttpErrorType) {
        // if (errorType instanceof HttpErrorType) {
        //     if (!errorType.code || typeof errorType.code !== 'number') throw new Error('An instance of HttpErrorType needs a \'code\' number parameter');
        //     if (!errorType.type || typeof errorType.type !== 'string') throw new Error('An instance of HttpErrorType needs a \'type\' string parameter');
        //     if (typeof errorType.message !== 'string') throw new Error('An instance of HttpErrorType needs a \'message\' string parameter');
        // }

        if (HttpError._types[errorType.type]) {
            throw new Error(`An HttpErrorType with type "${errorType.type}" already exists`);
        } else {
            HttpError._types[errorType.type] = errorType;
        }
    }

    public static overrideType(errorType: HttpErrorType) {
        if (!HttpError._types[errorType.type]) {
            throw new Error(`An HttpErrorType with type "${errorType.type}" doesn't exist, so it cannot be overridden`);
        } else {
            // logger.warn(`HttpErrorType with type "${errorType.type}" has been overridden`);
            HttpError._types[errorType.type] = errorType;
        }
    }

    private static _types: any;

    private static initTypes() {
        const errors = {
            'timeout': {
                message: "The connection was interrupted or has timed out"
            },
            'default': {
                message: "An unknown error has been thrown"
            },
            'internal_error': {
                status: 500,
                message: "An internal error has occurred"
            },
            'not_found': {
                status: 404,
                message: "The requested resource hasn't been found"
            },
            'unauthorized': {
                status: 403
            },
            'malformed_query': {
                status: 400
            },
            'already_exists': {
                status: 409,
                message: "A resource with the same key already exists"
            },
            'token_expired': {
                status: 410
            },
            'wrong_credentials': {
                status: 401
            }
          };

        for (const errorName in errors) {
            if (errors.hasOwnProperty(errorName)) {
                const error = errors[errorName];
                HttpError.addType({
                    code: error.status,
                    type: errorName,
                    message: error.message
                });
            }
        }
    }

    /*
     *  Instance members
     */

    public readonly type: HttpErrorType;

    constructor(errorType?: HttpErrorType | string | number) {
        // Initialize error list
        if (!HttpError._types) { HttpError.initTypes(); }

        if (!errorType) {
            errorType = HttpError._types.default;
        }

        // Find error type
        let error: HttpErrorType;
        if (typeof errorType === 'string') {
            error = errorType = HttpError._types[errorType];
        } else if (typeof errorType === 'number') {
            error = HttpError._types.find((e: any) => !!HttpError._types[e] && HttpError._types[e].status === 'number');
        }

        if (!error) {
            throw new Error(`Unknown error type "${errorType}"`);
        }

        // Compose error string
        let string = 'HTTP';
        if (error.code) { string += ` ${error.code}`; }
        if (error.type) { string += ` [${error.type}]`; }
        if (error.message) { string += `: ${error.message}`; }
        super(string);

        this.type = error;
    }

    public sendResponse(res: Response) {
        res.status(this.type.code || 500).send({ error: this.type.type });
    }
}
