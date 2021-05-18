/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/require-await */

import { promiseTimeout } from '../src';

import 'mocha';
import { expect } from 'chai';
import { deepFreeze } from '../src/utils/objectUtils';

describe('Utils', () => {
    describe('deepFreeze function', () => {
        it('should freeze objects and their fields recursively', () => {
            const a: any = { a: "x", b: { bb: "y" }};
            const icicle: any = deepFreeze(a);

            expect(Object.isFrozen(icicle)).to.be.true;
            expect(Object.isFrozen(icicle.a)).to.be.true;
            expect(Object.isFrozen(icicle.b)).to.be.true;
            expect(Object.isFrozen(icicle.b.bb)).to.be.true;
        });
    });

    describe('promiseTimeout function', () => {
        const promiseTime: number = 100;
        const promiseTimeoutMargin: number = 0.5;
        const promiseFunc: ()=>Promise<string> = async () => new Promise((resolve) => {
            setTimeout(() => { resolve('hello') }, promiseTime);
        });

        it('should resolve promise before timeout', async () => {
            const result: string = await promiseTimeout(promiseTime + promiseTime * promiseTimeoutMargin, promiseFunc());
            expect(result).to.eq('hello');
        });

        it('should reject promise after timeout with error', async () => {
            try {
                await promiseTimeout(promiseTime - promiseTime * promiseTimeoutMargin, promiseFunc());
                expect.fail("Promise should have timed out");
            } catch(e) {
                expect(e instanceof Error).to.be.true;
            }
        });

        it('should reject promise after timeout without error', async () => {
            try {
                const result: string = await promiseTimeout(promiseTime - promiseTime * promiseTimeoutMargin, promiseFunc(), false);
                expect(result).to.be.eq(null);
            } catch(e) {
                expect.fail("Promise should not fail with error");
            }
        });
    })
});