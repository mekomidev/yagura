import { Layer } from './layer';
import { Service } from './service';
import { YaguraError } from '../utils/errors';
import { Logger, DefaultLogger } from '../services/logger.service';

import { Event } from './event';
import { AppEvent, AppEventType } from './app.event';

import * as colors from 'colors/safe';
import { DefaultErrorHandler, ErrorHandler } from '../services/errorHandler.service';

export class Yagura {
    private _isInit: boolean;
    private _stack: Layer[];
    protected logger: Logger;

    public static async start(layers: Layer[], services?: Service[]): Promise<Yagura> {
        const app: Yagura = new Yagura(layers);

        // Initialize services
        app.logger = await app.registerService(new DefaultLogger()); // instantiates a temporary logger for basic operations
        await app.registerService(new DefaultErrorHandler());
        await app._initializeServices(services ?? []);
        app.logger = app.getService<Logger>('Logger'); // replaces the app logger with whatever is available after init

        // Initialize layers
        await app._initializeStack();

        // Set app state to initialized
        app._isInit = true;
        app._initializeHandlers();

        // Dispatch start event
        await app.dispatch(new AppEvent(AppEventType.start));

        // Drain pre-init queue
        while(app._dispatchQueue.length > 0) {
            const ev = app._dispatchQueue.pop();
            try { await app.dispatch(ev); }
            catch(err) { await app.handleError(err); }
        }

        return app;
    }

    private constructor(layers: Layer[]) {
        this._stack = layers;
    }

    /** Initializes Layers in a bottom-up order */
    private async _initializeStack() {
        for (const o of this._stack.slice().reverse()) {
            try {
                await o.initialize(this);
            } catch (err) {
                this.logger.error(`Failed to initialize layer: ${o.toString()}`);
                await this.handleError(err);
                break;
            }
        }
    }

    /** Initializes Node error handlers */
    private _initializeHandlers() {
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
    }

    /*
     *  Event subsystem
     */
    private _dispatchQueue: Event[] = [];
    public async dispatch(event: Event): Promise<void> {
        if (!this._isInit) {
            this.logger.warn('[EVENT] Dispatch method called before initialize, queued for later');
            this._dispatchQueue.push(event);
            return null;
        }

        this.logger.debug(`[EVENT] Dispatched event ${event.constructor.name}#${event.id}`);
        const startTime: number = Date.now();

        // Check if event was handled already
        if (event.wasConsumed) {
            this.logger.warn(`[EVENT] An already handled event has been sent to Yagura for handling again; this could cause an event handling loop`);

            if (process.env.NODE_ENV !== 'production') {
                // do nothing, let it loop
                this.logger.warn(`[EVENT] Development mode, recycling event: ${colors.bold(event.constructor.name)}#${event.id}`);
                (event as any).guard._handledFlag = false;
            } else {
                // drop the event
                this.logger.warn('[EVENT] Dropping event');
                return;
            }
        }

        for (const layer of this._stack) {
            try {
                this.logger.verbose(`[EVENT] Handling event: ${event.constructor.name}#${event.id.dim} @ ${layer.constructor.name}`);
                const output = await layer.handleEvent(event);
                if (!output) {                                                  // null output implies consumed event
                    if(!event.wasConsumed) {                                    // ensure event consumed
                        this.logger.verbose('[EVENT] event implicitly consumed, consuming post-layer');
                        await event.consume();
                    }
                    break;                                                      // stop event flow when event consumed
                } else if(event.wasConsumed) {
                    this.logger.verbose('[EVENT] event explicitly consumed');
                    break;                                                      // stop event flow when event consumed
                } else {
                    this.logger.verbose('[EVENT] flow should continue');
                    event = output;
                }
            } catch (e) {
                this.logger.verbose('[EVENT] flow errored');
                try {
                    await layer.handleError(e instanceof Error ? e : new Error((e as object).toString()));
                } catch (e2) {
                    await this.handleError(e2);
                }

                break;  // stop event flow on error
            }

            this.logger.verbose('[EVENT] continue event flow');
        }

        // If event wasn't consumed by layers, force-consume
        try {
            if(event && !event.wasConsumed) {
                await event.consume();
            }
        } catch (err) {
            this.logger.verbose('[EVENT] forced consumption errored');
            await this.handleError(err);
        }

        this.logger.verbose('[EVENT] event flow end');
        this.logger.debug(`[EVENT] Consumed event ${event.constructor.name}#${event.id} ` + `(${Date.now() - startTime}ms)`.dim);
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
                await this.handleError(new Error(`Failed to initialize service '${s.constructor.name}\n${(err as Error).stack.toString()}'`));
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
        if(!this.getService(name, vendor)) { return null; }

        const app: Yagura = this;
        const proxy: M = new Proxy<M>(app.getService(name, vendor), {
            get: (o, key) => {
                return app.getService(name, vendor)[key];
            },
            set: (o, key, value) => {
                const service: M = app.getService(name, vendor);
                if(Object.prototype.hasOwnProperty.call(service, key)) {
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

        await mod.initialize(this);

        // TODO: evaluate whether the proxy should be returned
        return mod; // this.getServiceProxy(mod.name);
    }

    public async handleError(e: any | Error | YaguraError) {
        if (!this._isInit) {
            console.warn(`Error occurred during initialization`);
            console.error(e);
            return process.exit(-1);
        }

        // Everything's wrapped in a try-catch to avoid infinite loops
        try {
            // Wrap the error in YaguraError if it isn't already
            // TODO: consider whether this approach is appropriate
            let err: YaguraError;
            if (e instanceof YaguraError) {
                err = e;
            } else if(e instanceof Error) {
                err = new YaguraError(e);
            } else if (typeof e === 'string') {
                err = new YaguraError(e);
            } else if(typeof e === 'object' || typeof e === 'number') {
                err = new YaguraError(`Error: ${(e as object).toString()}`)
            } else {
                err = new YaguraError('Unknown error thrown');
            }

            // Check if event was handled already
            if (!!err.guard.wasHandled) {
                this.logger.warn(`An already handled error has been sent to Yagura for handling again; this could cause an error handling loop\n${err.stack}`);
            } else {
                err.guard.flagHandled();
            }

            await this.getService<ErrorHandler>('ErrorHandler').handle(err);
        } catch (err) {
            console.error(`FAILED TO HANDLE ERROR\n${(err as Error).stack.toString()}`);
        }
    }

    private async _handleShutdown() {
        this.logger.info('Shutting down...');
        await this.dispatch(new AppEvent(AppEventType.shutdown));
    }
}

interface ServiceHolder<M extends Service> {
    active: M;
    vendors: { [name: string]: M };
}
