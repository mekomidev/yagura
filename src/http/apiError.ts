export interface ApiErrorType {
    code?: number;
    type: string;
    message?: string;
}

/** Error to be thrown for HTTP API responses */
export class ApiError extends Error {
    /*
     *  Static members
     */

    public static addType(errorType: ApiErrorType) {
        // if (errorType instanceof ApiErrorType) {
        //     if (!errorType.code || typeof errorType.code !== 'number') throw new Error('An instance of ApiErrorType needs a \'code\' number parameter');
        //     if (!errorType.type || typeof errorType.type !== 'string') throw new Error('An instance of ApiErrorType needs a \'type\' string parameter');
        //     if (typeof errorType.message !== 'string') throw new Error('An instance of ApiErrorType needs a \'message\' string parameter');
        // }

        if (ApiError._types[errorType.type]) {
            throw new Error(`An ApiErrorType with type "${errorType.type}" already exists`);
        } else {
            ApiError._types[errorType.type] = errorType;
        }
    }

    public static overrideType(errorType: ApiErrorType) {
        if (!ApiError._types[errorType.type]) {
            throw new Error(`An ApiErrorType with type "${errorType.type}" doesn't exist, so it cannot be overridden`);
        } else {
            // logger.warn(`ApiErrorType with type "${errorType.type}" has been overridden`);
            ApiError._types[errorType.type] = errorType;
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
                ApiError.addType({
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

    protected _errorType: ApiErrorType;

    constructor(errorType?: ApiErrorType | string | number) {
        // Initialize error list
        if (!ApiError._types) { ApiError.initTypes(); }

        if (!errorType) {
            errorType = ApiError._types.default;
        }

        // Find error type
        let error: ApiErrorType;
        if (typeof errorType === 'string') {
            error = errorType = ApiError._types[errorType];
        } else if (typeof errorType === 'number') {
            error = ApiError._types.find((e: any) => !!ApiError._types[e] && ApiError._types[e].status === 'number');
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

        this._errorType = error;
    }

    // public sendResponse(res: express.Response) {
    //     res.status(this._errorType.code || 500).send({ error: this._errorType.type });
    // }
}
