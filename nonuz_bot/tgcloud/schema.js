import { table, integer, text, sql } from 'sdk/db';

export const orders = table('orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id'),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  address: text('address'),
  items: text('items').notNull(),
  totalPrice: integer('total_price').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});
