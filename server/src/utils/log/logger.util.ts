import winston, { format } from "winston";

const { combine, errors, json, timestamp, prettyPrint, align, printf } = format;

export const DbLogger = winston.createLogger({
  level: "info",
  format: combine(
    errors({ stack: true }),
    timestamp({
      format: "YYYY-MM-DD hh:mm:ss.SSS A",
    }),
    json()
  ),
  defaultMeta: { service: "database" },
  transports: [
    new winston.transports.Console({ level: "error" }),
    new winston.transports.File({ dirname: "logs", filename: "database.log" }),
  ],
});

export const RouteLogger = winston.createLogger({
  level: "debug",
  format: combine(
    errors({ stack: true }),
    timestamp({ format: "YYYY-MM-DD hh:mm:ss.SSS A" }),
    json()
  ),
  defaultMeta: { service: "route" },
  transports: [
    new winston.transports.Console({ level: "error" }),
    new winston.transports.File({ dirname: "logs", filename: "routes.log" }),
  ],
});
