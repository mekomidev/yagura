/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/require-await */
import { Yagura, Layer, Service, YaguraEvent, YaguraError, ErrorHandler, eventFilter } from '../src';
import { AppEvent, AppEventType } from '../src/framework/app.event';

import 'mocha';
import * as sinon from 'sinon';
import { expect } from 'chai';

describe('Framework', () => {
    it('should instantiate and initialize correctly', async () => {
        const app: Yagura = await Yagura.start([]);
        expect(app).to.be.instanceOf(Yagura);
    });

    class DummyService extends Service {
        constructor(vendor: string = 'test') {
            super('Dummy', vendor);
        }

        public text: string = 'world';
        public hello(): string {
            return this.text;
        }
    }

    describe('Service handling', () => {
        class BetterDummyService extends DummyService {
            constructor() {
                super('cool');
            }

            public text: string = "cool world";
        }

        // let app: Yagura;

        it('should register, mount and initialize a service', async () => {
            const app = await Yagura.start([]);
            const service: Service = new DummyService();

            // check if initialized
            const spy = sinon.spy(service, 'initialize');

            await app.registerService(service);

            expect(spy.called, "Service not initialized").to.be.eq(true);

            // check if mounted
            expect((service as any).yagura, "Service not mounted").to.be.eq(app);

            // check if registered
            expect(app.getService('Dummy'), "Service not registered").to.be.eq(service);
        });

        it('should retrieve a registered service', async () => {
            const app = await Yagura.start([], [new DummyService()]);
            const service: Service = app.getService('Dummy');

            expect(service).to.be.instanceOf(DummyService);
        });

        it('should fail to mount a Service twice', async () => {
            const app = await Yagura.start([], [new DummyService()]);
            const service: Service = app.getService('Dummy');

            try {
                await service.initialize(app);
                expect.fail();
            } catch (e) {
                expect(e).to.be.instanceOf(YaguraError);
            }
        });

        it('should return null when asking for a non-existent Service', async () => {
            const app = await Yagura.start([]);

            const service = app.getService('Dummy');
            expect(service).to.be.eq(null);
        });

        it('should return null when asking for a non-existent Service\'s proxy', async () => {
            const app = await Yagura.start([]);

            const proxy = app.getServiceProxy('Dummy');
            expect(proxy).to.be.eq(null);
        });

        it('should retrieve a registered service by vendor', async () => {
            const app = await Yagura.start([], [new DummyService()]);
            const service: Service = app.getService('Dummy', 'test');

            expect(service).to.be.instanceOf(DummyService);
        });

        it('should update the active service when registering a new vendor', async () => {
            const app = await Yagura.start([]);
            await app.registerService(new DummyService());
            await app.registerService(new BetterDummyService());

            const service: Service = app.getService('Dummy');

            expect(app.getService('Dummy'), "New service not active").to.be.eq(service);
            expect(app.getService('Dummy', 'cool'), "New service not available by vendor").to.be.eq(service);
            expect(app.getService('Dummy', 'test'), "Old service has been deregistered").to.be.instanceOf(DummyService);
        });

        describe('Service proxy', () => {
            it('should return a service proxy', async () => {
                const app = await Yagura.start([], [new DummyService()]);
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

            it('should return existing properties', async () => {
                const app = await Yagura.start([], [new DummyService()]);
                const proxy: DummyService = app.getServiceProxy('Dummy');

                expect(proxy.text).to.not.be.eq(undefined);
            });

            it('should not return non-existing properties', async () => {
                const app = await Yagura.start([], [new DummyService()]);
                const proxy: DummyService = app.getServiceProxy('Dummy');

                expect((proxy as any).text2).to.be.eq(undefined);
            });

            it('should set existing properties', async () => {
                const app = await Yagura.start([], [new DummyService()]);
                const proxy: DummyService = app.getServiceProxy('Dummy');

                proxy.text = 'hello2';

                expect(proxy.text).to.be.eq('hello2');
            });

            it('should not set non-existing properties', async () => {
                const app = await Yagura.start([], [new DummyService()]);
                const proxy: DummyService = app.getServiceProxy('Dummy');

                try { (proxy as any).text2 = 'hello2'; }
                catch(e) { expect(e).to.be.instanceOf(TypeError); }

                expect((proxy as any).text2).to.not.be.eq('hello2');
            });

            it('should return prototype', async () => {
                const app = await Yagura.start([], [new DummyService()]);
                const proxy: DummyService = app.getServiceProxy('Dummy');

                expect(proxy.constructor.prototype).to.be.eq(DummyService.prototype);
            });

            it('should return whether is extensible', async () => {
                const service = new DummyService();
                const app = await Yagura.start([], [service]);
                const proxy: DummyService = app.getServiceProxy('Dummy');

                expect(Object.isExtensible(proxy)).to.be.eq(Object.isExtensible(service));
            });

            it('should be able to prevent extensions', async () => {
                const service = new DummyService();
                const app = await Yagura.start([], [service]);
                const proxy: DummyService = app.getServiceProxy('Dummy');

                Object.preventExtensions(service);

                expect(Object.isExtensible(proxy)).to.be.eq(Object.isExtensible(service));
            });
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

            expect(fake.lastCall.lastArg).to.be.instanceOf(AppEvent);
            expect((fake.lastCall.lastArg as AppEvent).data).to.equal(AppEventType.shutdown);
        });
    });

    describe('Initialization', () => {
        it('should initialize services at start', async () => {
            const service = new DummyService();
            const spy = sinon.spy(service, 'initialize');

            await Yagura.start([], [service]);

            expect(spy.called, "Service not initialized").to.be.eq(true);
        });

        it('should dispatch a ServerEvent of type `start`', async () => {
            const spy = sinon.spy(Yagura.prototype, 'dispatch');
            await Yagura.start([]);

            spy.restore();

            expect(spy.called, "Dispatch not called").to.be.eq(true);
            expect(spy.args[0][0], "Not a ServerEvent").to.be.instanceOf(AppEvent);
            expect((spy.args[0][0] as AppEvent).data, "Not value 'start'").to.be.eq(AppEventType.start);
        });
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

        it('should consume event if none of the layers don\'t', async () => {
            const app = await Yagura.start([]);
            const event = new DummyEvent({ hello: 'world' });

            // fake consume
            const fake = sinon.fake.resolves(null);
            sinon.replace(event, 'consume', fake);

            await app.dispatch(event);

            expect(fake.called).to.be.eq(true);
        });
    });

    describe('Error handling', () => {
        class ErrorInitLayer extends Layer {
            async onInitialize() {
                console.log('hello');
            }

            public handleEvent(e: YaguraEvent): Promise<YaguraEvent> {
                console.log('hello');
                return null;
            }

            public async handleError(err: Error) {
                console.error('error handled: ' + err.name);
            }
        }

        it('should handle given error', async () => {
            const app = await Yagura.start([]);

            const errorHandler = app.getService<ErrorHandler>('ErrorHandler');
            const fake = sinon.fake.resolves(null);
            sinon.replace(errorHandler, 'handle', fake);

            await app.handleError(new Error('hello'));
        });

        it('should re-throw errors at stack initialization', async () => {
            const layer = new ErrorInitLayer();
            const fake = sinon.fake.throws(new Error('error thrown'));
            sinon.replace(layer, 'onInitialize', fake);

            const spy = sinon.spy(Yagura.prototype, 'handleError');

            try { await Yagura.start([layer]); }
            catch (e) { expect(e).to.be.instanceOf(Error) }

            spy.restore();
            expect(spy.called).to.be.eq(true);
        });

        it('should catch errors at Services\' initialization', async () => {
            const service = new DummyService();
            const fake = sinon.fake.throws(new Error('service init fail'));
            sinon.replace(service, 'initialize', fake);


            const spy = sinon.spy(Yagura.prototype, 'handleError');
            try { await Yagura.start([], [service]); }
            catch (e) { expect(e).to.be.instanceOf(Error) }

            sinon.restore();
            expect(spy.called).to.be.eq(true);
        });

        it('should redirect error handling to Layer when event consumption fails', async () => {
            const layer = new ErrorInitLayer();
            const fake = sinon.fake.throws(new Error('error thrown'));
            sinon.replace(layer, 'handleEvent', fake);

            const spy = sinon.spy(layer, 'handleError');

            await Yagura.start([layer]);

            spy.restore();
            expect(spy.called).to.be.eq(true);
        });

        it('should catch errors when error handling by Layer fails', async () => {
            const layer = new ErrorInitLayer();
            const fake = sinon.fake.throws(new Error('error thrown'));
            sinon.replace(layer, 'handleEvent', fake);
            sinon.replace(layer, 'handleError', fake);

            const spy = sinon.spy(Yagura.prototype, 'handleError');

            await Yagura.start([layer]);

            spy.restore();
            expect(spy.called).to.be.eq(true);
        });

        it('should catch errors when forced consumption of Event fails', async () => {
            const fake = sinon.fake.throws(new Error('error thrown'));
            sinon.replace(AppEvent.prototype, 'consume', fake);

            const spy = sinon.spy(Yagura.prototype, 'handleError');

            await Yagura.start([]);

            sinon.restore();
            expect(spy.called).to.be.eq(true);
        });

        afterEach(() => {
            sinon.restore();
        })
    });
});
