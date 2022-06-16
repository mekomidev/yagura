// Framework APIs
import { Yagura } from './framework/yagura';
import { Layer } from './framework/layer';
import { Service } from './framework/service';
import { Event, eventFilter } from './framework/event';

import { YaguraError } from './utils/errors';
import { promiseTimeout } from './utils/promise.utils';
import { HandleGuard } from './utils/handleGuard';

import { Logger, DefaultLogger } from './services/logger.service';
import { ErrorHandler, DefaultErrorHandler } from './services/errorHandler.service';

export {
    // Framework
    Yagura,
    Layer,
    Service,
    Event,
    /**
     * Alias for Event, added for backwards compatibility
     *
     * @deprecated
     * */
    Event as YaguraEvent,
    // Errors
    YaguraError,
    // Services
    Logger, DefaultLogger,
    ErrorHandler, DefaultErrorHandler,
    // Utils
    eventFilter, promiseTimeout, HandleGuard
};
