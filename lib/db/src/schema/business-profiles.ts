import { pgTable, serial, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const businessProfilesTable = pgTable("business_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }).unique(),
  companyName: text("company_name").notNull(),
  tin: text("tin").notNull(),
  registeredAddress: text("registered_address").notNull(),
  city: text("city"),
  state: text("state"),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone").notNull(),
  firsConnected: boolean("firs_connected").notNull().default(false),
  firsApiKey: text("firs_api_key"),
  taxOfficeCode: text("tax_office_code"),
  subscriptionPlan: text("subscription_plan"),
  subscriptionActivatedAt: timestamp("subscription_activated_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertBusinessProfileSchema = createInsertSchema(businessProfilesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBusinessProfile = z.infer<typeof insertBusinessProfileSchema>;
export type BusinessProfile = typeof businessProfilesTable.$inferSelect;
