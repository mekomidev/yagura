/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/require-await */
import { Yagura, Layer, Service, YaguraEvent, YaguraError, eventFilter } from '../src';
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
            constructor(vendor: string = 'test') {
                super('Dummy', vendor);
            }

            public text: string = 'world';
            public hello(): string {
                return this.text;
            }
        }

        class BetterDummyService extends DummyService {
            constructor() {
                super('cool');
            }

            public text: string = "cool world";
        }

        let app: Yagura;

        it('should register, mount and initialize a service', async () => {
            app = await Yagura.start([]);
            const service: Service = new DummyService();

            // check if initialized
            const fake = sinon.fake.resolves(null);
            sinon.replace(service, 'initialize', fake);

            await app.registerService(service);

            expect(fake.called, "Service not initialized").to.be.eq(true);

            // check if mounted
            expect((service as any).yagura, "Service not mounted").to.be.eq(app);

            // check if registered
            expect(app.getService('Dummy'), "Service not registered").to.be.eq(service);
        });

        it('should fail to mount a Service twice', () => {
            const service: Service = app.getService('Dummy');

            try {
                service.mount(app);
                expect.fail();
            } catch (e) {
                expect(e).to.be.instanceOf(YaguraError);
            }
        })

        it('should retrieve a registered service', () => {
            const service: Service = app.getService('Dummy');

            expect(service).to.be.instanceOf(DummyService);
        });

        it('should return null when asking for a non-existent Service');

        it('should return null when asking for a non-existent Service\'s proxy');

        it('should retrieve a registered service by vendor', () => {
            const service: Service = app.getService('Dummy', 'test');

            expect(service).to.be.instanceOf(DummyService);
        });

        it('should update the active service when registering a new vendor', async () => {
            const service: Service = new BetterDummyService();
            await app.registerService(service);

            expect(app.getService('Dummy'), "New service not active").to.be.eq(service);
            expect(app.getService('Dummy', 'cool'), "New service not available by vendor").to.be.eq(service);
            expect(app.getService('Dummy', 'test'), "Old service has been deregistered").to.be.instanceOf(DummyService);
        });

        describe('Service proxy', () => {
            it('should return a service proxy', async () => {
                app = await Yagura.start([]);

                await app.registerService(new DummyService());
                const proxy: DummyService = app.getServiceProxy('Dummy');

                // check basic access
                expect(proxy, "Isn't a vaild instance of service").to.be.instanceOf(DummyService);
                expect(proxy.text, "Doesn't allow read access to its property").to.be.eq('world');

                proxy.text = 'za warudo';
                expect(proxy.text, "Doesn't allow write access to its property").to.be.eq('za warudo');

                expect(proxy.hello(), "Doesn't allow read access to its method").to.be.eq('za warudo');

                // check if replacement works
                await app.registerService(new BetterDummyService());
                expect(proxy, "Isn't a vaild instance of new service").to.be.instanceOf(BetterDummyService);
                expect(proxy.text, "Doesn't allow read access to its property").to.be.eq('cool world');
            });

            it('should return existing properties');

            it('should not return non-existing properties');

            it('should set existing properties');

            it('should not set non-existing properties');

            it('should return prototype');

            it('should return whether is extensible');

            it('should be able to prevent extensions');
        });
    });

    describe('Layer management', () => {
        /** Example Layer implementation */
        class DummyLayer extends Layer {
            constructor() {
                super({});
            }

            public async handleEvent(e: YaguraEvent): Promise<YaguraEvent> {
                return null;
            }
        }

        it('should have Layer after initialization', async () => {
            const layer = new DummyLayer();
            const app = await Yagura.start([layer]);

            expect((app as any)._stack).to.contain(layer);
        });

        it('should contain the Yagura app reference after mounting', async () => {
            const layer = new DummyLayer();
            const app = await Yagura.start([layer]);
            expect((layer as any).yagura).to.equal(app);
        });

        it('should pass events through layers according to their declaration order', async () => {
            class CounterEvent extends YaguraEvent {
                public counter: number = 0;
                protected async onConsumed() {
                    expect(this.counter).to.be.eq(2);
                }
            }

            class FirstLayer extends Layer {
                @eventFilter([CounterEvent])
                public async handleEvent(event: CounterEvent): Promise<CounterEvent> {
                    expect(event.counter).to.be.eq(0);
                    ++event.counter;
                    return event;
                }
            }

            class SecondLayer extends Layer {
                @eventFilter([CounterEvent])
                public async handleEvent(event: CounterEvent): Promise<CounterEvent> {
                    expect(event.counter).to.be.eq(1);
                    ++event.counter;
                    return event;
                }
            }

            const app = await Yagura.start([new FirstLayer({}), new SecondLayer({})]);
            await app.dispatch(new CounterEvent({}));
        });

        it('should filter Events when eventFilter decorator is applied', async () => {
            class GoodEvent extends YaguraEvent {}
            class BadEvent extends YaguraEvent {}
            class FilteringLayer extends Layer {
                @eventFilter([GoodEvent])
                public async handleEvent(event: YaguraEvent): Promise<YaguraEvent> {
                    await Promise.resolve(); return event;
                }
            }

            const layer = new FilteringLayer({});
            const app = await Yagura.start([layer]);

            const eventA = new BadEvent({});
            const fakeA = sinon.fake.resolves(null);
            sinon.replace(eventA, 'consume', fakeA);
            await app.dispatch(eventA);
            expect(fakeA.callCount).to.be.eq(2);        // consumed twice, after return from layer and end of flow

            const eventB = new GoodEvent({});
            const fakeB = sinon.fake.resolves(null);
            sinon.replace(eventB, 'consume', fakeB);
            await app.dispatch(eventB);
            expect(fakeB.callCount).to.be.eq(1);        // consumed once, at end of flow because untouched by layers
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

    describe('Initialization', () => {
        it('should initialize services at start', async () => {
            class DummyService extends Service {
                constructor() {
                    super('Dummy', 'test');
                }

                public async initialize() { /* */ }
            }

            const service = new DummyService();
            const fake = sinon.fake.resolves(null);
            sinon.replace(service, 'initialize', fake);

            await Yagura.start([], [service]);

            expect(fake.called, "Service not initialized").to.be.eq(true);
        });
        it('should initialize layers at start');
        it('should dispatch a ServerEvent of type `start`');
    });

    describe('Event handling', () => {
        /** Example Layer implementation */
        class DummyLayer extends Layer {
            constructor() {
                super({});
            }

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
        it('should consume event if none of the layers don\'t');
    });

    describe('Error handling', () => {
        it('should catch errors at stack initialization');
        it('should catch errors at Services\' initialization');
        it('should catch errors when event handling by Layer fails');
        it('should catch errors when error handling by Layer fails');
        it('should catch errors when forced consumption of Event fails');
        it('should throw error when dispatching event before initialization');
        it('should handle given error');
        it('should not throw any other errors itself');
        it('should not handle the same error more than once');
    });
});
