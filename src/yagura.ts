import { Overlay } from './overlay';
import { Module } from './module';
import { YaguraError, StubError } from './utils/errors';
import { Logger, DefaultLogger } from './modules/logger.module';

import _colors = require('colors');
import { YaguraEvent } from './event';
import { HandleGuard } from './utils/handleGuard';

export class Yagura {
    private static _stack: Overlay[];
    protected static logger: Logger;

    public static async start(overlays: Overlay[]) {
        if (Yagura._stack) {
            throw new YaguraError(`Yagura has already been initialized, you cannot call start() more than once`);
        }

        // Mount handlers
        process.on('beforeExit', async () => {
            await this._handleShutdown();
        });

        process.on('unhandledRejection', async (err: Error) => {
            await this.handleError(err);
        });

        process.on('uncaughtException', async (err: Error) => {
            await this.handleError(err);
        });

        // Initialize base modules
        Yagura.logger = Yagura.registerModule(new DefaultLogger());

        // Initialize Overlay
        this._stack = overlays;

        for (const o of this._stack.reverse()) {
            try {
                await o.initialize();
            } catch (err) {
                this.logger.error(`Failed to initialize overlay: ${o.toString()}`);
                await this.handleError(err);
                break;
            }
        }
    }

    /*
     *  Event subsystem
     */
    public static async dispatch(event: YaguraEvent): Promise<void> {
        // Check if event was handled already
        if (event.guard.wasHandled) {
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

        // TODO: evaluate whether the proxy should be returned
        return mod; // this.getModuleProxy(mod.name);
    }

    public static async handleError(e: Error | YaguraError) {
        // Wrap the error in YaguraError if it isn't already
        // TODO: consider whether this approach is appropriate
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
    }

    private static async _handleShutdown() {
        this.logger.info('Shutting down...');
    }
}

interface ModuleHolder<M extends Module> {
    active: M;
    vendors: { [name: string]: M };
}
