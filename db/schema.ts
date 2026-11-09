import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const dashboardState = sqliteTable('dashboard_state', {
 id: text('id').primaryKey(), content: text('content').notNull(),
 revision: integer('revision').notNull(), updatedAt: text('updated_at').notNull(),
});
