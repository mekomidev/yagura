import { Layer } from './layer';
import { Service } from './service';
import { YaguraError } from '../utils/errors';
import { Logger, DefaultLogger } from '../services/logger.service';

import { YaguraEvent } from './event';
import { ServerEvent, ServerEventType } from './server.event';

require('clarify');
import * as colors from 'colors/safe';
import { DefaultErrorHandler, ErrorHandler } from '../services/errorHandler.service';

export class Yagura {
    private _isInit: boolean;
    private _stack: Layer[];
    protected logger: Logger;

    public static async start(layers: Layer[], services?: Service[]): Promise<Yagura> {
        const app: Yagura = new Yagura(layers);

        // Initialize services
        await app.registerService(new DefaultErrorHandler());
        app.logger = await app.registerService(new DefaultLogger());
        await app._initializeServices(services ?? []);

        // Initialize layers
        await app._initializeStack();

        app._isInit = true;
        return app;
    }

    private constructor(layers: Layer[]) {
        // Mount handlers
        if (process.env.NODE_ENV !== 'test') {
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            process.on('beforeExit', async () => {
                await this._handleShutdown();
            });

            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            process.on('unhandledRejection', async (err: Error) => {
                await this.handleError(err);
            });

            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            process.on('uncaughtException', async (err: Error) => {
                await this.handleError(err);
            });
        }

        this._stack = layers;
    }

    private async _initializeStack() {
        // TODO: consider cache impact given by reverting the array
        for (const o of this._stack.reverse()) {
            try {
                o.mount(this);
                await o.initialize();
            } catch (err) {
                this.logger.error(`Failed to initialize layer: ${o.toString()}`);
                await this.handleError(err);
                break;
            }
        }
    }

    /*
     *  Event subsystem
     */
    public async dispatch(event: YaguraEvent): Promise<void> {
        if (!this._isInit) {
            throw new Error('dispatch method called before initialize');
        }

        // Check if event was handled already
        if (event.wasConsumed) {
            this.logger.warn(`An already handled event has been sent to Yagura for handling again; this could cause an event handling loop`);

            if (process.env.NODE_ENV !== 'production') {
                // do nothing, let it loop
                this.logger.warn(`Re-handled event: ${colors.bold(event.constructor.name)}#${event.id}`);
                (event as any).guard._handledFlag = false;
            } else {
                // drop the event
                this.logger.warn('Dropping event');
                return;
            }
        }

        for (const layer of this._stack) {
            try {
                const output: YaguraEvent = await layer.handleEvent(event);
                if (!output && !event.wasConsumed) {
                    await event.consume();
                    break;
                } else {
                    event = output;
                }
            } catch (e) {
                try {
                    await layer.handleError(e);
                } catch (e2) {
                    await this.handleError(e2);
                }

                break;
            }

            // If event wasn't consumed by layers, force-consume
            if(!event.wasConsumed) {
                await event.consume();
            }
        }
    }

    /*
     *  Services subsystem
     */
    private _services: { [name: string]: ServiceHolder<any> } = {};
    // {
    //     "name": {
    //         active: Service,
    //         vendors: {
    //             "default": Service,
    //             "vendor1": Service
    //         }
    //     }
    // }

    private async _initializeServices(services: Service[]) {
        for(const s of services) {
            try {
                await this.registerService(s);
            } catch(err) {
                this.logger.error(new Error(`Failed to initialize service '${s.constructor.name}\n${(err as Error).stack.toString()}'`));
            }
        }
    }

    public getService<M extends Service>(name: string, vendor?: string): M {
        const m: ServiceHolder<M> = this._services[name];

        if (!m) {
            return null;
        } else {
            if (vendor) {
                if (m.vendors[vendor]) {
                    return m.vendors[vendor];
                } else {
                    return null;
                }
            } else {
                return m.active;
            }
        }
    }

    /**
     * Returns a Service proxy object, which will always store the reference to the active instance of the requested Service
     *
     * @param name name of the Service to be adapted
     * @returns {Service} a Service proxy for the requested Service
     */
    public getServiceProxy<M extends Service>(name: string, vendor?: string): M {
        if (!this._isInit) {
            throw new Error('getServiceProxy method called before start');
        }

        const app: Yagura = this;
        const proxy: M = new Proxy<M>(app.getService(name, vendor), {
            get: (o, key) => {
                return app.getService(name, vendor)[key];
            },
            set: (o, key, value) => {
                const service: M = app.getService(name, vendor);
                if(Object(service).hasOwnProperty(key)) {
                    service[key] = value;
                    return true;
                } else {
                    return false;
                }
            },
            apply: (o, key) => {
                return app.getService(name, vendor)[key]();
            },
            getPrototypeOf: () => {
                return Object.getPrototypeOf(app.getService(name, vendor));
            },
            setPrototypeOf: (o, v) => {
                return Object.setPrototypeOf(app.getService(name, vendor), v);
            },
            isExtensible: () => {
                return Object.isExtensible(app.getService(name, vendor));
            },
            preventExtensions: () => {
                Object.preventExtensions(app.getService(name, vendor));
                return true;
            }
        });

        return proxy;
    }

    public async registerService<M extends Service>(mod: M): Promise<M> {
        // TODO: evaluate whether necessary
        // if (!this._isInit) {
        //     throw new Error('registerService method called before start');
        // }

        let m: ServiceHolder<M> = this._services[mod.name];

        if (!m) {
            m = {
                active: mod,
                vendors: {
                    [mod.vendor]: mod
                }
            };

            m.vendors[mod.vendor] = mod;

            this._services[mod.name] = m;
        } else {
            if (m.vendors[mod.vendor]) {
                // throw new YaguraError(`Service '${mod.name}' has already been registered for vendor '${mod.vendor}'`);
            } else {
                m.active = mod;
                m.vendors[mod.vendor] = mod;
            }
        }

        mod.mount(this);
        await mod.initialize();

        // TODO: evaluate whether the proxy should be returned
        return mod; // this.getServiceProxy(mod.name);
    }

    public async handleError(e: Error | YaguraError) {
        if (!this._isInit) {
            throw new Error('handleError method called before start');
        }

        // Everything's wrapped in a try-catch to avoid infinite loops
        try {
            // Wrap the error in YaguraError if it isn't already
            // TODO: consider whether this approach is appropriate
            let err: YaguraError;
            if (e instanceof YaguraError) {
                err = e;
            } else {
                err = new YaguraError(e);
            }

            // Check if event was handled already
            if (!!err.guard.wasHandled) {
                this.logger.warn(`An already handled error has been sent to Yagura for handling again; this could cause an error handling loop\n${err.stack}`);
            } else {
                err.guard.flagHandled();
            }

            await this.getService<ErrorHandler>('ErrorHandler').handle(e);
        } catch (err) {
            console.error(`FAILED TO HANDLE ERROR\n${(err as Error).stack.toString()}`);
        }
    }

    private async _handleShutdown() {
        this.logger.info('Shutting down...');
        await this.dispatch(new ServerEvent(ServerEventType.shutdown));
    }
}

interface ServiceHolder<M extends Service> {
    active: M;
    vendors: { [name: string]: M };
}
