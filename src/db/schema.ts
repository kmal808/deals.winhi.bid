import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'representative'])
export const productCategoryEnum = pgEnum('product_category', ['window', 'door'])

// Representatives (Users)
export const representatives = pgTable('representatives', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  username: varchar('username', { length: 100 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  role: userRoleEnum('role').notNull().default('representative'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Customers
export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  representativeId: integer('representative_id')
    .references(() => representatives.id)
    .notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  address: varchar('address', { length: 500 }),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 50 }).default('HI'),
  zip: varchar('zip', { length: 20 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  altPhone: varchar('alt_phone', { length: 20 }),
  comments: text('comments'),

  // Contract-specific fields
  discountPercent: decimal('discount_percent', { precision: 5, scale: 2 }).default('0'),
  downPaymentAmount: decimal('down_payment_amount', { precision: 10, scale: 2 }),
  estimateStartDate: varchar('estimate_start_date', { length: 50 }),
  estimateEndDate: varchar('estimate_end_date', { length: 50 }),
  noGrid: boolean('no_grid').default(false),

  // Signature (SVG data)
  signatureSvg: text('signature_svg'),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Brands
export const brands = pgTable('brands', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  factor: decimal('factor', { precision: 8, scale: 4 }).notNull(),
  active: boolean('active').notNull().default(true),
  sortOrder: integer('sort_order').default(0),
})

// Frame Colors
export const frameColors = pgTable('frame_colors', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  hexColor: varchar('hex_color', { length: 7 }),
  factor: decimal('factor', { precision: 8, scale: 4 }).notNull().default('0'),
  active: boolean('active').notNull().default(true),
  sortOrder: integer('sort_order').default(0),
})

// Frame Types
export const frameTypes = pgTable('frame_types', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  factor: decimal('factor', { precision: 8, scale: 4 }).notNull().default('0'),
  active: boolean('active').notNull().default(true),
  sortOrder: integer('sort_order').default(0),
})

// Glass Types
export const glassTypes = pgTable('glass_types', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  factor: decimal('factor', { precision: 8, scale: 4 }).notNull().default('0'),
  imagePath: varchar('image_path', { length: 255 }),
  active: boolean('active').notNull().default(true),
  sortOrder: integer('sort_order').default(0),
})

// Grid Styles
export const gridStyles = pgTable('grid_styles', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  factor: decimal('factor', { precision: 8, scale: 4 }).notNull().default('0'),
  imagePath: varchar('image_path', { length: 255 }),
  active: boolean('active').notNull().default(true),
  sortOrder: integer('sort_order').default(0),
})

// Grid Sizes
export const gridSizes = pgTable('grid_sizes', {
  id: serial('id').primaryKey(),
  size: varchar('size', { length: 50 }).notNull().unique(),
  active: boolean('active').notNull().default(true),
  sortOrder: integer('sort_order').default(0),
})

// Product Configurations (window/door types)
export const productConfigs = pgTable('product_configs', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  category: productCategoryEnum('category').notNull(),
  operationType: varchar('operation_type', { length: 50 }),
  liteCount: integer('lite_count').default(1),
  description: text('description'),
  imagePath: varchar('image_path', { length: 255 }).notNull(),
  svgTemplate: text('svg_template'),
  active: boolean('active').notNull().default(true),
  sortOrder: integer('sort_order').default(0),
})

// Windows (line items for a customer)
export const windows = pgTable('windows', {
  id: serial('id').primaryKey(),
  customerId: integer('customer_id')
    .references(() => customers.id, { onDelete: 'cascade' })
    .notNull(),

  // Location identifier
  location: varchar('location', { length: 255 }).notNull(),

  // Configuration references
  brandId: integer('brand_id').references(() => brands.id),
  productConfigId: integer('product_config_id').references(() => productConfigs.id),
  frameTypeId: integer('frame_type_id').references(() => frameTypes.id),
  frameColorId: integer('frame_color_id').references(() => frameColors.id),
  glassTypeId: integer('glass_type_id').references(() => glassTypes.id),
  gridStyleId: integer('grid_style_id').references(() => gridStyles.id),
  gridSizeId: integer('grid_size_id').references(() => gridSizes.id),

  // Dimensions
  width: varchar('width', { length: 50 }).notNull(),
  height: varchar('height', { length: 50 }).notNull(),

  // Options
  lowE: boolean('low_e').default(true),
  isDoor: boolean('is_door').default(false),

  // Pricing
  calculatedPrice: decimal('calculated_price', { precision: 10, scale: 2 }),
  manualPrice: decimal('manual_price', { precision: 10, scale: 2 }),
  applyCustomDiscount: boolean('apply_custom_discount').default(false),
  customDiscountPercent: decimal('custom_discount_percent', { precision: 5, scale: 2 }).default('0'),

  // Notes
  specialInstructions: text('special_instructions'),

  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Disclaimers (global templates)
export const disclaimers = pgTable('disclaimers', {
  id: serial('id').primaryKey(),
  description: text('description').notNull(),
  sortOrder: integer('sort_order').default(0),
  includeByDefault: boolean('include_by_default').default(true),
  active: boolean('active').notNull().default(true),
})

// Contract Disclaimers (customer-specific)
export const contractDisclaimers = pgTable('contract_disclaimers', {
  id: serial('id').primaryKey(),
  customerId: integer('customer_id')
    .references(() => customers.id, { onDelete: 'cascade' })
    .notNull(),
  description: text('description').notNull(),
  sortOrder: integer('sort_order').default(0),
})

// Application Settings
export const settings = pgTable('settings', {
  key: varchar('key', { length: 100 }).primaryKey(),
  value: text('value').notNull(),
  description: text('description'),
})

// Relations
export const representativesRelations = relations(representatives, ({ many }) => ({
  customers: many(customers),
}))

export const customersRelations = relations(customers, ({ one, many }) => ({
  representative: one(representatives, {
    fields: [customers.representativeId],
    references: [representatives.id],
  }),
  windows: many(windows),
  contractDisclaimers: many(contractDisclaimers),
}))

export const windowsRelations = relations(windows, ({ one }) => ({
  customer: one(customers, {
    fields: [windows.customerId],
    references: [customers.id],
  }),
  brand: one(brands, {
    fields: [windows.brandId],
    references: [brands.id],
  }),
  productConfig: one(productConfigs, {
    fields: [windows.productConfigId],
    references: [productConfigs.id],
  }),
  frameType: one(frameTypes, {
    fields: [windows.frameTypeId],
    references: [frameTypes.id],
  }),
  frameColor: one(frameColors, {
    fields: [windows.frameColorId],
    references: [frameColors.id],
  }),
  glassType: one(glassTypes, {
    fields: [windows.glassTypeId],
    references: [glassTypes.id],
  }),
  gridStyle: one(gridStyles, {
    fields: [windows.gridStyleId],
    references: [gridStyles.id],
  }),
  gridSize: one(gridSizes, {
    fields: [windows.gridSizeId],
    references: [gridSizes.id],
  }),
}))

export const contractDisclaimersRelations = relations(contractDisclaimers, ({ one }) => ({
  customer: one(customers, {
    fields: [contractDisclaimers.customerId],
    references: [customers.id],
  }),
}))
