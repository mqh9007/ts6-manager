export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

const levelWeight: Record<LogLevel, number> = { DEBUG: 10, INFO: 20, WARN: 30, ERROR: 40 };
const configuredLevel = String(process.env.LOG_LEVEL || 'INFO').toUpperCase() as LogLevel;
const minimumLevel: LogLevel = levelWeight[configuredLevel] ? configuredLevel : 'INFO';

function write(level: LogLevel, component: string, message: string, meta?: unknown) {
  if (levelWeight[level] < levelWeight[minimumLevel]) return;
  const prefix = `[${new Date().toISOString()}] [${level}] [${component}]`;
  const output = meta === undefined ? `${prefix} ${message}` : `${prefix} ${message} ${formatMeta(meta)}`;
  if (level === 'ERROR') console.error(output);
  else if (level === 'WARN') console.warn(output);
  else console.log(output);
}

function formatMeta(meta: unknown): string {
  if (meta instanceof Error) return `error=${meta.message}`;
  if (typeof meta === 'string') return meta;
  try { return JSON.stringify(meta); } catch { return String(meta); }
}

export const logger = {
  debug: (component: string, message: string, meta?: unknown) => write('DEBUG', component, message, meta),
  info: (component: string, message: string, meta?: unknown) => write('INFO', component, message, meta),
  warn: (component: string, message: string, meta?: unknown) => write('WARN', component, message, meta),
  error: (component: string, message: string, meta?: unknown) => write('ERROR', component, message, meta),
};
