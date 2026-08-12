import { createFileRoute, Outlet } from '@tanstack/react-router'

/**
 * Pass-through layout for everything under a customer.
 *
 * The detail screen lives in `$customerId/index.tsx`. This file previously held
 * that screen directly, which meant the `estimate` and `contract` child routes
 * matched but had no <Outlet /> to render into — clicking either did nothing.
 */
export const Route = createFileRoute('/_protected/customers/$customerId')({
  component: () => <Outlet />,
})
