import { Yagura } from "..";
import { HttpApiOverlay, HttpApiConfig, HttpServerOverlay, HttpServerConfig, HttpRouter } from '../http';
import { DefaultLogger } from "../modules/logger.module";

const serverConfig: HttpServerConfig = {
    port: 8080,
    defaultError: 500
};

const apiConfig: HttpApiConfig = {
    options: {
        debugTime: true
    }
};

class ExampleApiOverlay extends HttpApiOverlay {
    constructor(config: HttpApiConfig) {
        super('ExampleApi', config);
    }

    public async initialize() {
        // TODO
    }

    public async declareRoutes(router: HttpRouter) {
        router.route('/').get(async (event) => {
            event.send(200, 'Hello World');
        });
    }
}

Yagura.registerModule(new DefaultLogger());
Yagura.start([new HttpServerOverlay(serverConfig), new ExampleApiOverlay(apiConfig)]);
