import { pgTable, timestamp, uuid, primaryKey } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const blocksTable = pgTable("blocks", {
  blockerId: uuid("blocker_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  blockedId: uuid("blocked_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.blockerId, table.blockedId] }),
]);

export type Block = typeof blocksTable.$inferSelect;
