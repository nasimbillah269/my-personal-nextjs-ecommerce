import { getTableName, sql, type Column } from "drizzle-orm";

/**
 * A column as `table`.`column`, for the outer side of a correlated subquery.
 * In a query without joins Drizzle prints bare column names, so in
 * `(SELECT … FROM order_items WHERE ${orderItems.orderId} = ${orders.id})` the `id` would bind to
 * order_items.id instead of orders.id. Wrapping the outer column with this keeps it pointing outward.
 */
export const outer = (column: Column) => sql`${sql.identifier(getTableName(column.table))}.${sql.identifier(column.name)}`;
