import fs from "node:fs";
import path from "node:path";
import { defineConfig, env } from "prisma/config";

const envFiles =
  process.env.NODE_ENV === "production"
    ? [".env.production", ".env"]
    : [".env.development", ".env"];

for (const file of envFiles) {
  const fullPath = path.resolve(__dirname, file);
  if (!fs.existsSync(fullPath)) continue;

  const lines = fs.readFileSync(fullPath, "utf-8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");
    process.env[key] ??= value;
  }
}

export default defineConfig({
  schema: path.join(__dirname, "prisma", "schema.prisma"),
  datasource: {
    url: env("DATABASE_URL"),
  },
  migrations: {
    path: path.join(__dirname, "prisma", "migrations"),
    seed: "ts-node prisma/seed.ts",
  },
});
