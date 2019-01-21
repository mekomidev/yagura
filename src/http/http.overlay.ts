import { YaguraEvent } from "../event";
import { Overlay } from '../overlay';
import { Model } from '../model';
import { OverlayConfig } from "..";
import { HttpStrategyConfig } from "./http.strategy";
import { ApiError, ApiErrorType } from './apiError';

export interface HttpOverlayConfig extends OverlayConfig {
    strategy: HttpStrategyConfig;
    errorCodes?: [ApiErrorType];
}

export abstract class HttpOverlay extends Overlay {
    public readonly config: HttpOverlayConfig;

    constructor(config: HttpOverlayConfig) {
        super(config);

        // Initialize all defined error types
        if (this.config.errorCodes && this.config.errorCodes.length > 0) {
            this.config.errorCodes.forEach((errorCode) => {
                ApiError.addType(errorCode);
            });
        }
    }

    
}
