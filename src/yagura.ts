import { Overlay, OverlayConfig } from './overlay';
import { Module } from './module';
import { YaguraError, StubError } from './utils/errors';
import { Logger, DefaultLogger } from './modules/logger.module';

import _colors = require('colors');
import { YaguraEvent } from './event';
import { HandleGuard } from './utils/handleGuard';

export class Yagura {
    private static _overlay: Overlay;
    private static logger: Logger;

    public static async start(overlay: Overlay) {
        if (Yagura._overlay) {
            throw new YaguraError(`Yagura has already been initialized, you cannot call start() more than once`);
        }

        // Mount handlers
        process.on('beforeExit', async () => {
            await this._handleShutdown();
        });

        process.on('unhandledRejection', async (err) => {
            await this.handleError(err);
        });

        process.on('uncaughtException', async (err) => {
            await this.handleError(err);
        });

        // Initialize dependencies
        Yagura.logger = Yagura.registerModule(new DefaultLogger());

        // Initialize Overlay
        Yagura._overlay = overlay;

        // Connect to DB ?
        // await this._connectDatabase();

        // Start overlay
    }

    /*
     *  Event subsystem
     */
    public static handleEvent(event: YaguraEvent) {
        // Check if event was handled already
        if (event.guard.wasHandled) {
            this.logger.warn(`An already handled event has been sent to Yagura for handling again; this could cause an event handling loop\n${event.toString()}`);
        } else {
            event.guard.flagHandled();
        }

        this._overlay.handleEvent(event);
    }

    /*
     *  Modules subsystem
     */
    private static _modules: { [name: string]: ModuleHolder<any> } = {};
    // {
    //     "name": {
    //         active: Module,
    //         vendors: {
    //             "default": Module,
    //             "vendor1": Module
    //         }
    //     }
    // }

    public static getModule<M extends Module>(name: string, vendor?: string): M {
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
    public static getModuleProxy<M extends Module>(name: string): M {
        throw new StubError();
        return null;
    }

    public static registerModule<M extends Module>(mod: M): M {
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
                throw new YaguraError(`Module '${mod.name}' has already been registered for vendor '${mod.vendor}'`);
            } else {
                m.active = mod;
                m.vendors[mod.vendor] = mod;
            }
        }

        return mod; // this.getModuleProxy(mod.name);
    }

    public static async handleError(e: Error | YaguraError) {
        // Wrap the error in YaguraError if it isn't already
        let err: YaguraError;
        if (e instanceof YaguraError) {
            err = e;
        } else {
            e = new YaguraError(e);
        }

        // Check if event was handled already
        if (err.guard.wasHandled) {
            this.logger.warn(`An already handled event has been sent to Yagura for handling again; this could cause an event handling loop\n${event.toString()}`);
        } else {
            err.guard.flagHandled();
        }

        this.logger.error(err);

        if (!!this._overlay) {
            await this._overlay.handleError(err);
        }
    }

    private static async _handleShutdown() {
        this.logger.info('Shutting down...');
    }
}

interface ModuleHolder<M extends Module> {
    active: M;
    vendors: { [name: string]: M };
}
