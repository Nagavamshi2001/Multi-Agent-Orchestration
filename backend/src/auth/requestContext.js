import { AsyncLocalStorage } from 'async_hooks';

const storage = new AsyncLocalStorage();

export const runWithContext = (context, fn) => storage.run(context, fn);

export const getContext = () => storage.getStore() || {};

