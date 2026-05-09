/**
 * cleanup-seed-data.ts
 *
 * Removes ALL seeded/demo accounts and their associated content.
 * ON DELETE CASCADE handles posts, likes, saves, comments, follows, notifications.
 *
 * Safe to run multiple times — idempotent.
 */
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { inArray } from "drizzle-orm";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
});

// All seeded/demo emails — never real user accounts
const SEEDED_EMAILS = [
  // Original demo accounts
  "alice@pinview.com",
  "bob@pinview.com",
  "sara@pinview.com",
  "tiger@pinview.com",
  // Creator ecosystem
  "jack@pinview.com",
  "marcus@pinview.com",
  "ryan@pinview.com",
  "jake@pinview.com",
  "chris@pinview.com",
  "dan@pinview.com",
  "maya@pinview.com",
  "frank@pinview.com",
];

async function cleanup() {
  console.log("Looking for seeded accounts to remove...");

  const toDelete = await db
    .select({ id: usersTable.id, email: usersTable.email, username: usersTable.username })
    .from(usersTable)
    .where(inArray(usersTable.email, SEEDED_EMAILS));

  if (toDelete.length === 0) {
    console.log("No seeded accounts found. Database is already clean.");
    await pool.end();
    return;
  }

  console.log(`Found ${toDelete.length} seeded account(s):`);
  for (const u of toDelete) {
    console.log(`  • @${u.username} <${u.email}>`);
  }

  const ids = toDelete.map(u => u.id);

  // Deleting users cascades to:
  //   posts → likes, saves, comments (on post), notifications
  //   follows, likes, saves, comments (as author), notifications (as actor/recipient)
  const { rowCount } = await pool.query(
    `DELETE FROM users WHERE id = ANY($1::uuid[])`,
    [ids],
  );

  console.log(`\n✓ Deleted ${rowCount} user(s) and all associated content via CASCADE.`);
  console.log("Database is now clean — only real user data remains.");

  await pool.end();
}

cleanup().catch(async e => {
  console.error(e);
  await pool.end();
  process.exit(1);
});
