import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import pino from "pino-http";
import rateLimit from "express-rate-limit";
import getStarted from "./routes/getStarted";
import verify from "./routes/verify";
import invites from "./routes/invites";
import join from "./routes/join";
import billing from "./routes/billing";
import stripeWebhook from "./routes/stripeWebhook";
import tenantsRouter from "./routes/tenants";
import { env } from "./lib/env";

const app = express();

const publicLimiter = rateLimit({ 
  windowMs: env.RATE_LIMIT_WINDOW_MS, 
  max: env.RATE_LIMIT_MAX,
  message: { error: "Too many requests" }
});

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(pino());
app.use("/api/webhooks/stripe", stripeWebhook);
app.use(express.json());
app.use(cookieParser());

app.use("/api", publicLimiter, getStarted);
app.use("/api", publicLimiter, verify);
app.use("/api", invites);
app.use("/api", join);
app.use("/api", billing);
app.use("/api", tenantsRouter);

app.get("/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Beta onboarding server running on port ${PORT}`));

export default app;