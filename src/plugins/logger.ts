import Elysia from "elysia";
import winston from "winston";

export class Logger extends winston.Logger {}
export interface LoggingConfig {
  prefix: string;
  console: boolean;
  output: string;
  level: string;
  levels?: { [level: string]: number };
  colors?: { [level: string]: string };
  timestamp: string;
  meta: {
    [key: string]: any;
  };
}

const config = {
  level: "debug",
  prefix: "Fabric Gateway",
  timestamp: "ddd DD/MM/YY hh:mm:ss.SSS A",
  colors: {
    debug: "blue",
    error: "red",
    global: "cyan",
    info: "green",
    verbose: "magenta",
    warn: "yellow",
  },
  levels: {
    debug: 5,
    error: 2,
    global: 0,
    info: 1,
    verbose: 4,
    warn: 3,
  },
};

export function createLogger(service?: string) {
  const transports = [];
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          (info) =>
            `[${info.timestamp}] (${info.level}) ${
              service ? `${service}@${config.prefix}` : config.prefix
            }: ${info.message}`
        )
      ),
    })
  );
  if (config.colors) winston.addColors(config.colors);

  return winston.createLogger({
    defaultMeta: config.meta,
    level: config.level || "verbose",
    levels: config.levels || winston.config.npm.levels,
    format: winston.format.timestamp({
      format: config.timestamp,
    }),
    transports,
  });
}

export default function (config: LoggingConfig) {
  return new Elysia().decorate("logger", createLogger(config));
}
