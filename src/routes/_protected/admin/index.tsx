import { createFileRoute, Link } from '@tanstack/react-router'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Package,
  Frame,
  Palette,
  Layers,
  Grid3X3,
  Ruler,
  Settings2,
  FileText
} from 'lucide-react'

export const Route = createFileRoute('/_protected/admin/')({
  component: AdminIndexPage,
})

const configItems = [
  {
    title: 'Brands',
    description: 'Manage window/door brands and pricing factors',
    icon: Package,
    href: '/admin/brands',
  },
  {
    title: 'Frame Types',
    description: 'Configure frame materials (vinyl, aluminum, etc.)',
    icon: Frame,
    href: '/admin/frame-types',
  },
  {
    title: 'Frame Colors',
    description: 'Manage available colors with hex codes',
    icon: Palette,
    href: '/admin/frame-colors',
  },
  {
    title: 'Glass Types',
    description: 'Configure glass options (clear, tinted, etc.)',
    icon: Layers,
    href: '/admin/glass-types',
  },
  {
    title: 'Grid Styles',
    description: 'Manage window grid patterns',
    icon: Grid3X3,
    href: '/admin/grid-styles',
  },
  {
    title: 'Grid Sizes',
    description: 'Configure available grid dimensions',
    icon: Ruler,
    href: '/admin/grid-sizes',
  },
  {
    title: 'Product Configs',
    description: 'Define window/door types and configurations',
    icon: Settings2,
    href: '/admin/product-configs',
  },
  {
    title: 'Disclaimers',
    description: 'Manage contract disclaimers and terms',
    icon: FileText,
    href: '/admin/disclaimers',
  },
]

function AdminIndexPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Configuration</h1>
        <p className="text-gray-500">
          Manage system configuration tables for pricing and product options
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {configItems.map((item) => (
          <Link key={item.href} to={item.href as any}>
            <Card className="hover:border-blue-300 hover:shadow-md transition-all cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <item.icon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-base">{item.title}</CardTitle>
                  <CardDescription className="text-sm">{item.description}</CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
