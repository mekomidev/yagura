import { HttpRequest } from "../http";

export class RestImplementationError extends Error {
    public readonly method: string;
    public readonly path: string;

    constructor(event: HttpRequest, comment?: string) {
        super();

        this.method = event.req.method;
        this.path = event.req.originalUrl;

        this.message = `The implementation of ${this.method} ${this.path} does not meet REST standards; ` + comment || '';
    }
}
