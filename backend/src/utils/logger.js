const levelEnabled = (level) => {
  const envLevel = (process.env.LOG_LEVEL || 'info').toLowerCase();
  const order = ['error', 'warn', 'info', 'debug', 'trace'];
  return order.indexOf(level) <= order.indexOf(envLevel);
};

const baseFields = () => ({
  ts: new Date().toISOString(),
  env: process.env.NODE_ENV || 'development',
});

const format = (level, msg, ctx) => {
  const meta = { ...baseFields(), level, msg, ...ctx };
  const { ts, env, ...rest } = meta;
  const parts = Object.entries(rest).map(([k, v]) => `${k}=${String(v)}`);
  return `[${ts}] [${env}] ${parts.join(' ')}`;
};

export const logger = {
  info(msg, ctx = {}) {
    if (!levelEnabled('info')) return;
    console.log(format('info', msg, ctx));
  },
  warn(msg, ctx = {}) {
    if (!levelEnabled('warn')) return;
    console.warn(format('warn', msg, ctx));
  },
  error(msg, ctx = {}) {
    if (!levelEnabled('error')) return;
    console.error(format('error', msg, ctx));
  },
  debug(msg, ctx = {}) {
    if (!levelEnabled('debug')) return;
    console.debug(format('debug', msg, ctx));
  },
};

