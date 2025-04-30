import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db } from "./index";

async function runMigrations() {
  console.log("Running migrations...");

  try {
    await migrate(db, { migrationsFolder: "./db/migrations" });
    console.log("Migrations completed successfully");
  } catch (error) {
    console.error("Error running migrations:", error);
    process.exit(1);
  }

  process.exit(0);
}

runMigrations();
