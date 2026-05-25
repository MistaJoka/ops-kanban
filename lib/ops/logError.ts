type LogContext = {
  route?: string;
  code?: string;
  orgId?: string;
  digest?: string;
};

export function logError(message: string, context: LogContext = {}) {
  console.error(
    JSON.stringify({
      level: 'error',
      message,
      ...context,
      ts: new Date().toISOString(),
    }),
  );
}
