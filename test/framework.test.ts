import { Yagura, Layer, Service, YaguraEvent } from '../src';
import { ServerEvent, ServerEventType } from '../src/framework/server.event';

import 'mocha';
import * as sinon from 'sinon';
import { expect } from 'chai';

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
            constructor() {
                super({});
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
        it('should notify Layers on shutdown', async () => {
            const layer = new DummyLayer();
            const app = await Yagura.start([layer]);

            const fake = sinon.fake.resolves(null);
            sinon.replace(layer, 'handleEvent', fake);

            (app as any)._handleShutdown();

            expect(fake.lastCall.lastArg).to.be.instanceOf(ServerEvent);
            expect((fake.lastCall.lastArg as ServerEvent).data).to.equal(ServerEventType.shutdown);
        });
    });

    describe('Event handling', () => {
        /** Example Layer implementation */
        class DummyLayer extends Layer {
            constructor() {
                super({});
            }

            public async initialize() { /* */ }
            public async handleEvent(e: YaguraEvent): Promise<YaguraEvent> {
                return null;
            }
        }
        class DummyEvent extends YaguraEvent {
            public dummyField: any;

            public constructor(data: any) {
                super(data);
                this.dummyField = data;
            }
        }

        it('should dispatch event to Layer', async () => {
            const layer = new DummyLayer();
            const app = await Yagura.start([layer]);
            const event = new DummyEvent({ hello: 'world' });

            const fake = sinon.fake.resolves(null);
            sinon.replace(layer, 'handleEvent', fake);

            await app.dispatch(event);

            expect(fake.lastCall.lastArg).to.be.instanceOf(DummyEvent);
            expect(fake.lastCall.lastArg).to.be.eq(event);
        });
        it('should let Layer handle event error', async () => {
            const layer = new DummyLayer();
            const app = await Yagura.start([layer]);
            const event = new DummyEvent({ hello: 'world' });

            const fakeEventHandler = sinon.fake.throws(new Error());
            sinon.replace(layer, 'handleEvent', fakeEventHandler);

            const fakeErrorHandler = sinon.fake.resolves(null);
            sinon.replace(layer, 'handleError', fakeErrorHandler);

            const fakeYaguraErrorHandler = sinon.fake.resolves(null);
            sinon.replace(app, 'handleError', fakeYaguraErrorHandler);

            await app.dispatch(event);

            expect(fakeErrorHandler.called).to.be.eq(true);
            expect(fakeYaguraErrorHandler.called).to.be.eq(false);
        });
        it('should catch Layer\'s error handling error if that crashes', async () => {
            const layer = new DummyLayer();
            const app = await Yagura.start([layer]);
            const event = new DummyEvent({ hello: 'world' });

            const fakeEventHandler = sinon.fake.throws(new Error());
            sinon.replace(layer, 'handleEvent', fakeEventHandler);

            const fakeErrorHandler = sinon.fake.throws(new Error());
            sinon.replace(layer, 'handleError', fakeErrorHandler);

            const fakeYaguraErrorHandler = sinon.fake.resolves(null);
            sinon.replace(app, 'handleError', fakeYaguraErrorHandler);

            await app.dispatch(event);

            expect(fakeErrorHandler.called).to.be.eq(true);
            expect(fakeYaguraErrorHandler.called).to.be.eq(true);
        });
        it('should not handle the same event twice in production', async () => {
            const layer = new DummyLayer();
            const app = await Yagura.start([layer]);
            const event = new DummyEvent({ hello: 'world' });

            const fake = sinon.fake.resolves(null);
            sinon.replace(layer, 'handleEvent', fake);

            process.env.NODE_ENV = 'production';

            await app.dispatch(event);
            await app.dispatch(event);

            expect(fake.callCount).to.be.eq(1);

            process.env.NODE_ENV = 'test';
        });
        it('should allow to handle the same event over and over in development', async () => {
            const layer = new DummyLayer();
            const app = await Yagura.start([layer]);
            const event = new DummyEvent({ hello: 'world' });

            const fake = sinon.fake.resolves(null);
            sinon.replace(layer, 'handleEvent', fake);

            process.env.NODE_ENV = 'development';

            await app.dispatch(event);
            await app.dispatch(event);

            expect(fake.callCount).to.be.eq(2);

            process.env.NODE_ENV = 'test';
        });
    });

    describe('Error handling', () => {});
});
