/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/require-await */
import { Service } from '../src';

import 'mocha';
import { expect } from 'chai';

describe('Services', () => {
    class DummyService extends Service {
        constructor() {
            super('Dummy', 'test');
        }

        private content: string;

        public async initialize() { this.content = 'world'; }

        public hello(): string {
            return this.content;
        }
    }

    describe('Service class', () => {
        it('should initialize correctly', async () => {
            const service: DummyService = new DummyService();
            await service.initialize();
            expect(service.hello()).to.equal('world');
        });

        it('should not work without initializing', async () => {
            const service: DummyService = new DummyService();
            // await service.initialize();
            expect(service.hello()).to.not.equal('world');
        });
    });
});
