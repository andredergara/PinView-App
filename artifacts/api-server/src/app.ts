import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import router from "./routes";
import { logger } from "./lib/logger";
import { pool } from "@workspace/db";

const app: Express = express();

// Trust the Replit reverse-proxy so req.secure / req.ip are correct
app.set("trust proxy", 1);

const PgStore = connectPgSimple(session);

app.use(
  pinoHttp.default({
    logger,
    serializers: {
      req(req: any) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res: any) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Treat as production when either NODE_ENV=production OR REPLIT_DEPLOYMENT is set.
// The Replit deployment runner does not inject NODE_ENV, so check both.
const isProduction =
  process.env.NODE_ENV === "production" ||
  !!process.env.REPLIT_DEPLOYMENT;

logger.info(
  {
    isProduction,
    NODE_ENV: process.env.NODE_ENV,
    REPLIT_DEPLOYMENT: !!process.env.REPLIT_DEPLOYMENT,
  },
  "Session config",
);

const pgStore = new PgStore({
  pool,
  tableName: "sessions",
  createTableIfMissing: true,
  errorLog: (...args: unknown[]) =>
    logger.error({ args }, "Session store error"),
});

app.use(
  session({
    store: pgStore,
    secret: process.env.SESSION_SECRET ?? "pinview-dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction,
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
      // SameSite=Lax works for same-domain deployments (Replit) and is
      // accepted by all browsers including Safari/iOS.
      // SameSite=None is only needed for cross-site requests and is
      // blocked by many browsers/extensions without special opt-in.
      sameSite: "lax",
    },
  }),
);

app.use("/api", router);

export default app;
