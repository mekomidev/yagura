class PromiseTimeoutError extends Error {}

export const promiseTimeout = async function(ms: number, promise: Promise<any>, throwError: boolean = true) {
    let timeoutId: NodeJS.Timeout;
    const timeout = new Promise((resolve, reject) => {
        timeoutId = setTimeout(() => {
            reject(new PromiseTimeoutError(`Promise timed out in ${ms}ms`));
        }, ms);
    });

    let result: any;
    let error: Error;
    try {
        result = await Promise.race([promise, timeout]);
    } catch (e) {
        error = e;
    }

    clearTimeout(timeoutId);    // always clear timeout
    timeoutId.unref();

    if(!!error) {
        if(!(error instanceof PromiseTimeoutError) || throwError) {
            throw error;
        } else {
            return null;
        }
    } else {
        return result;
    }
};
