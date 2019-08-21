export class TimeoutError extends Error {}

export const promiseTimeout = async function(ms: number, promise: Promise<any>, throwError: boolean = true) {
    const timeout = new Promise((resolve, reject) => {
        const id = setTimeout(() => {
            clearTimeout(id);
            reject(new TimeoutError(`Promise timed out in ${ms}ms`));
        });
    });

    const result = await Promise.race([promise, timeout]);
    if (result instanceof TimeoutError) {
        if (throwError) {
            throw result;
        } else {
            return null;
        }
    } else {
        return result;
    }
};
