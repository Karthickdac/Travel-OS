import { pgTable, text, uuid, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { companiesTable } from "./companies";

export const followUpTasksTable = pgTable("follow_up_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companiesTable.id),
  leadId: uuid("lead_id"),
  title: text("title").notNull(),
  relatedTo: text("related_to"), // customer/lead name
  assignedTo: text("assigned_to"),
  dueDate: date("due_date", { mode: "string" }).notNull(),
  priority: text("priority").notNull().default("medium"), // low, medium, high
  status: text("status").notNull().default("pending"), // pending, completed, cancelled
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertFollowUpTaskSchema = createInsertSchema(followUpTasksTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFollowUpTask = z.infer<typeof insertFollowUpTaskSchema>;
export type FollowUpTask = typeof followUpTasksTable.$inferSelect;
