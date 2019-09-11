import { Yagura, Service } from '../src';

import 'mocha';
import { expect } from 'chai';

describe('Services', () => {
    class DummyService extends Service {
        constructor() {
            super('Dummy', 'test');
        }

        public hello(): string {
            return 'world';
        }
    }

    describe('Service class', () => {
        it('should instantiate correctly and be usable', async () => {
            const service: DummyService = new DummyService();
            expect(service.hello()).to.be('world');
        });
    });

    describe('Service container', () => {
        
    });
});
