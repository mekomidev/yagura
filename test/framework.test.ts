import { Yagura, Layer, Service } from '../src';

import 'mocha';
import { expect } from 'chai';

describe('Framework', () => {
    it('should instantiate and initialize correctly', async () => {
        const app: Yagura = await Yagura.start([]);
    });

    describe('Service handling', () => {
        class DummyService extends Service {
            constructor() {
                super('Dummy', 'test');
            }
        }

        let app: Yagura;

        it('should register a service', async () => {
            app = await Yagura.start([]);
            const service: Service = new DummyService();
            app.registerService(service);
        });

        it('should retrieve a registered service', async () => {
            const service: Service = app.getService('Dummy');

            expect(service).to.be.instanceOf(DummyService);
        });
    });

    describe('Overlay management', () => {});

    describe('Event handling', () => {});

    describe('Error handling', () => {});
});
