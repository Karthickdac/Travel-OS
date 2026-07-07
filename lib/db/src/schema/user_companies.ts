import { pgTable, uuid, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { companiesTable } from "./companies";

export const userCompaniesTable = pgTable(
  "user_companies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companiesTable.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("user_companies_user_company_uq").on(t.userId, t.companyId)],
);

export type UserCompany = typeof userCompaniesTable.$inferSelect;
