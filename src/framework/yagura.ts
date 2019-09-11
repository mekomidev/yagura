import { Overlay } from './overlay';
import { Module } from './module';
import { YaguraError, StubError } from '../utils/errors';
import { Logger, DefaultLogger } from '../modules/logger.module';

import _colors = require('colors');
import { YaguraEvent } from './event';
import { HandleGuard } from '../utils/handleGuard';
import { ServerEvent, ServerEventType } from './server.event';
import { SemVer } from 'semver';

import 'colors';

const yaguraPackage = require('../../package.json');

export class Yagura {
    public static readonly version: SemVer = new SemVer(yaguraPackage.version);

    private _isInit: boolean;
    private _stack: Overlay[];
    protected logger: Logger;

    public static async start(overlays: Overlay[]): Promise<Yagura> {
        const app: Yagura = new Yagura(overlays);
        await app.initialize();

        return app;
    }

    private constructor(overlays: Overlay[]) {
        // Mount handlers
        if (process.env.NODE_ENV !== 'test') {
            process.on('beforeExit', async () => {
                await this._handleShutdown();
            });

            process.on('unhandledRejection', async (err: Error) => {
                await this.handleError(err);
            });

            process.on('uncaughtException', async (err: Error) => {
                await this.handleError(err);
            });
        }

        this._stack = overlays;
    }

    public async initialize() {
        // TODO: consider cache impact given by reverting the array
        for (const o of this._stack.reverse()) {
            try {
                o.mount(this);
                await o.initialize();
            } catch (err) {
                this.logger.error(`Failed to initialize overlay: ${o.toString()}`);
                await this.handleError(err);
                break;
            }
        }

        this._isInit = true;

        // Initialize base modules
        this.logger = this.registerModule(new DefaultLogger());
    }

    /*
     *  Event subsystem
     */
    public async dispatch(event: YaguraEvent): Promise<void> {
        if (!this._isInit) {
            throw new Error('dispatch method called before initialize');
        }

        // Check if event was handled already
        if (event.guard.wasHandled()) {
            this.logger.warn(`An already handled event has been sent to Yagura for handling again; this could cause an event handling loop`);

            if (process.env.NODE_ENV !== 'production') {
                // do nothing, let it loop
                this.logger.warn(`Re-handled event:\n${event.toString()}`);
            } else {
                // drop the event
                this.logger.warn('Dropping event');
                return;
            }
        } else {
            event.guard.flagHandled();
        }

        for (const o of this._stack) {
            try {
                event = await o.handleEvent(event);
                if (!event) {
                    break;
                }
            } catch (e) {
                try {
                    await o.handleError(e);
                } catch (e2) {
                    await this.handleError(e2);
                }

                break;
            }
        }
    }

    /*
     *  Modules subsystem
     */
    private _modules: { [name: string]: ModuleHolder<any> } = {};
    // {
    //     "name": {
    //         active: Module,
    //         vendors: {
    //             "default": Module,
    //             "vendor1": Module
    //         }
    //     }
    // }

    public getModule<M extends Module>(name: string, vendor?: string): M {
        if (!this._isInit) {
            throw new Error('getModule method called before initialize');
        }

        const m: ModuleHolder<M> = this._modules[name];

        if (!m) {
            return null;
        } else {
            if (vendor) {
                if (!m.vendors[vendor]) {
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
     * Returns a Module proxy object, which will always store the reference to the active instance of the requested Module
     *
     * @param name name of the Module to be adapted
     * @returns {Module} a Module proxy for the requested Module
     */
    public getModuleProxy<M extends Module>(name: string): M {
        if (!this._isInit) {
            throw new Error('getModuleProxy method called before initialize');
        }

        throw new StubError();
        return null;
    }

    public registerModule<M extends Module>(mod: M): M {
        if (!this._isInit) {
            throw new Error('registerModule method called before initialize');
        }

        let m: ModuleHolder<M> = this._modules[mod.name];

        if (!m) {
            m = {
                active: mod,
                vendors: {
                    [mod.vendor]: mod
                }
            };

            m.vendors[mod.vendor] = mod;

            this._modules[mod.name] = m;
        } else {
            if (m.vendors[mod.vendor]) {
                // throw new YaguraError(`Module '${mod.name}' has already been registered for vendor '${mod.vendor}'`);
            } else {
                m.active = mod;
                m.vendors[mod.vendor] = mod;
            }
        }

        // TODO: evaluate whether the proxy should be returned
        return mod; // this.getModuleProxy(mod.name);
    }

    public async handleError(e: Error | YaguraError) {
        if (!this._isInit) {
            throw new Error('handleError method called before initialize');
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
            if (!!err.guard.wasHandled()) {
                this.logger.warn(`An already handled error has been sent to Yagura for handling again; this could cause an error handling loop\n${err.stack}`);
            } else {
                err.guard.flagHandled();
            }

            this.logger.error(err);
        } catch (err) {
            console.error(`FAILED TO HANDLE ERROR\n${err.stack}`);
        }
    }

    private async _handleShutdown() {
        if (!this._isInit) {
            throw new Error('_handleShutdown method called before initialize');
        }

        this.logger.info('Shutting down...');
        await this.dispatch(new ServerEvent(ServerEventType.shutdown));
    }
}

interface ModuleHolder<M extends Module> {
    active: M;
    vendors: { [name: string]: M };
}
