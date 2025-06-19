/*
<ai_context>
Defines the database schema for medical documents in the Med Writer application.
</ai_context>
*/

import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

export const documentsTable = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

export type InsertDocument = typeof documentsTable.$inferInsert
export type SelectDocument = typeof documentsTable.$inferSelect
