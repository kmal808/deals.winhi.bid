import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Search, Eye, FileText, FileCheck } from 'lucide-react'
import { listCustomers } from '@/server/functions/customers'
import { getSession } from '@/lib/auth'

interface Customer {
  id: number
  name: string
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  phone: string | null
  email: string | null
  createdAt: Date | null
  representativeId: number
}

export const Route = createFileRoute('/_protected/customers')({
  loader: async () => {
    const session = await getSession()
    if (!session) return { customers: [], session: null }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const customers = await (listCustomers as any)({
      data: {
        representativeId: session.userId,
        role: session.role,
      },
    })
    return { customers, session }
  },
  component: CustomersPage,
})

const columnHelper = createColumnHelper<Customer>()

function CustomersPage() {
  const { customers } = Route.useLoaderData()
  const navigate = useNavigate()
  const [globalFilter, setGlobalFilter] = useState('')

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Name',
        cell: (info) => (
          <span className="font-medium text-gray-900">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor(
        (row) =>
          [row.address, row.city, row.state, row.zip].filter(Boolean).join(', '),
        {
          id: 'address',
          header: 'Address',
          cell: (info) => (
            <span className="text-gray-600 text-sm">{info.getValue() || '—'}</span>
          ),
        }
      ),
      columnHelper.accessor('phone', {
        header: 'Phone',
        cell: (info) => (
          <span className="text-gray-600">{info.getValue() || '—'}</span>
        ),
      }),
      columnHelper.accessor('email', {
        header: 'Email',
        cell: (info) => (
          <span className="text-gray-600 text-sm">{info.getValue() || '—'}</span>
        ),
      }),
      columnHelper.accessor('createdAt', {
        header: 'Created',
        cell: (info) => {
          const date = info.getValue()
          return (
            <span className="text-gray-500 text-sm">
              {date ? new Date(date).toLocaleDateString() : '—'}
            </span>
          )
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: '',
        cell: (info) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate({ to: '/customers/$customerId', params: { customerId: String(info.row.original.id) } })}
              title="View/Edit"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate({ to: '/customers/$customerId/estimate', params: { customerId: String(info.row.original.id) } })}
              title="View Estimate"
            >
              <FileText className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate({ to: '/customers/$customerId/contract', params: { customerId: String(info.row.original.id) } })}
              title="View Contract"
            >
              <FileCheck className="h-4 w-4" />
            </Button>
          </div>
        ),
      }),
    ],
    [navigate]
  )

  const table = useReactTable({
    data: customers || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'includesString',
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-500">
            Manage your customer estimates and contracts
          </p>
        </div>
        <Link to="/customers/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Customer
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search customers..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Customer table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {globalFilter ? 'Search Results' : 'Recent Customers'}
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({table.getFilteredRowModel().rows.length} customers)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {customers && customers.length > 0 ? (
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length > 0 ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="cursor-pointer"
                      onClick={() =>
                        navigate({
                          to: '/customers/$customerId',
                          params: { customerId: String(row.original.id) },
                        })
                      }
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No customers found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No customers yet.</p>
              <p className="text-sm mt-2">
                Create your first customer to get started.
              </p>
              <Link to="/customers/new" className="mt-4 inline-block">
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Customer
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
