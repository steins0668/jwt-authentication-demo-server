import { defineConfig } from "drizzle-kit";
import { ENV } from "../src/data";

export default defineConfig({
  schema: "./build/src/models/index.js",
  out: "./migrations",
  // dialect: "turso",
  dialect: "sqlite",
  dbCredentials: {
    url: ENV.getDbUrl(),
  },
});
