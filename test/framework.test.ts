import { Yagura, Layer, Service, YaguraEvent } from '../src';
import { ServerEvent, ServerEventType } from '../src/framework/server.event';

import 'mocha';
import * as sinon from 'sinon';
import { expect } from 'chai';
import * as SemVer from 'semver';

describe('Framework', () => {
    it('should instantiate and initialize correctly', async () => {
        const app: Yagura = await Yagura.start([]);
        expect(app).to.be.instanceOf(Yagura);
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

    describe('Layer management', () => {
        /** Example Layer implementation */
        class DummyLayer extends Layer {
            constructor(yaguraVersion?: SemVer.Range) {
                super('Dummy', {});
            }

            public async initialize() { /* */ }
            public async handleEvent(e: YaguraEvent): Promise<YaguraEvent> {
                return null;
            }
        }

        it('should have Layer after initialization', async () => {
            const layer = new DummyLayer();
            const app = await Yagura.start([layer]);

            expect((app as any)._stack).to.contain(layer);
        });

        it('should contain the Yagura app reference only after mounting', async () => {
            const layer = new DummyLayer();
            expect((layer as any).yagura).to.not.be.an('object');

            const app = await Yagura.start([layer]);
            expect((layer as any).yagura).to.equal(app);
        });
        it('should match Yagura version requirement', async () => {
            const versionRange = new SemVer.Range(`<${Yagura.version.format()}`);

            try {
                const layer = new DummyLayer(versionRange);
                const app = await Yagura.start([layer]);

                expect.fail();
            } catch (err) {
                expect(err).to.be.instanceOf(Error);
            }
        });
        it('should notify Layers on shutdown', async () => {
            const layer = new DummyLayer();
            const app = await Yagura.start([layer]);

            const fake = sinon.fake.resolves(null);
            sinon.replace(layer, 'handleEvent', fake);

            (app as any)._handleShutdown();

            expect(fake.lastCall.lastArg).to.be.instanceOf(ServerEvent);
            expect((fake.lastCall.lastArg as ServerEvent).type).to.equal(ServerEventType.shutdown);
        });
    });

    describe('Event handling', () => {});

    describe('Error handling', () => {});
});
