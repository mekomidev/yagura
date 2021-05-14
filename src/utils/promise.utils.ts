class PromiseTimeoutError extends Error {}

export const promiseTimeout = async function(ms: number, promise: Promise<any>, throwError: boolean = true) {
    const timeout = new Promise((resolve) => {
        const id = setTimeout(() => {
            clearTimeout(id);
            resolve(new PromiseTimeoutError(`Promise timed out in ${ms}ms`));
        }, ms);
    });

    const result = await Promise.race([promise, timeout]);
    if (result instanceof PromiseTimeoutError) {
        if (throwError) {
            throw result;
        } else {
            return null;
        }
    } else {
        return result;
    }
};
