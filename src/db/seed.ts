import { db } from '@/lib/db'
import {
  representatives,
  brands,
  frameColors,
  frameTypes,
  glassTypes,
  gridStyles,
  gridSizes,
  productConfigs,
  disclaimers,
} from './schema'
import bcrypt from 'bcryptjs'

async function seed() {
  console.log('Seeding database...')

  // Create admin user
  const passwordHash = await bcrypt.hash('admin123', 10)
  await db.insert(representatives).values({
    name: 'Admin User',
    username: 'admin',
    passwordHash,
    role: 'admin',
    email: 'admin@windowshawaii.com',
  }).onConflictDoNothing()

  // Brands
  await db.insert(brands).values([
    { name: 'Milgard', factor: '1.25', sortOrder: 1 },
    { name: 'Anlin', factor: '1.15', sortOrder: 2 },
    { name: 'PGT', factor: '1.20', sortOrder: 3 },
  ]).onConflictDoNothing()

  // Frame Colors
  await db.insert(frameColors).values([
    { name: 'White', hexColor: '#FFFFFF', factor: '0', sortOrder: 1 },
    { name: 'Tan', hexColor: '#D2B48C', factor: '0.05', sortOrder: 2 },
    { name: 'Bronze', hexColor: '#8B4513', factor: '0.10', sortOrder: 3 },
    { name: 'Black', hexColor: '#000000', factor: '0.15', sortOrder: 4 },
  ]).onConflictDoNothing()

  // Frame Types
  await db.insert(frameTypes).values([
    { name: 'NF', description: 'New Frame', factor: '0', sortOrder: 1 },
    { name: 'RET', description: 'Retrofit', factor: '0.10', sortOrder: 2 },
    { name: 'BLK', description: 'Block Frame', factor: '0.15', sortOrder: 3 },
    { name: 'RBO', description: 'Retrofit Block Out', factor: '0.20', sortOrder: 4 },
  ]).onConflictDoNothing()

  // Glass Types
  await db.insert(glassTypes).values([
    { name: 'Clear', description: 'Standard clear glass', factor: '0', sortOrder: 1 },
    { name: 'Low-E', description: 'Low emissivity coating', factor: '0.15', sortOrder: 2 },
    { name: 'Tinted', description: 'Grey/Bronze tint', factor: '0.10', sortOrder: 3 },
    { name: 'Obscure', description: 'Privacy glass', factor: '0.20', sortOrder: 4 },
  ]).onConflictDoNothing()

  // Grid Styles
  await db.insert(gridStyles).values([
    { name: 'None', factor: '0', sortOrder: 1 },
    { name: 'Colonial', factor: '0.10', sortOrder: 2 },
    { name: 'Prairie', factor: '0.10', sortOrder: 3 },
    { name: 'SDL', factor: '0.15', sortOrder: 4 },
  ]).onConflictDoNothing()

  // Grid Sizes
  await db.insert(gridSizes).values([
    { size: '5/8"', sortOrder: 1 },
    { size: '7/8"', sortOrder: 2 },
    { size: '1"', sortOrder: 3 },
  ]).onConflictDoNothing()

  // Product Configs - Windows
  await db.insert(productConfigs).values([
    { name: 'Single Hung', category: 'window', operationType: 'SH', liteCount: 1, imagePath: '/images/configs/single-hung.png', sortOrder: 1 },
    { name: 'Double Hung', category: 'window', operationType: 'DH', liteCount: 1, imagePath: '/images/configs/double-hung.png', sortOrder: 2 },
    { name: 'Horizontal Slider XO', category: 'window', operationType: 'XO', liteCount: 2, imagePath: '/images/configs/slider-xo.png', sortOrder: 3 },
    { name: 'Horizontal Slider OX', category: 'window', operationType: 'OX', liteCount: 2, imagePath: '/images/configs/slider-ox.png', sortOrder: 4 },
    { name: 'Horizontal Slider XOX', category: 'window', operationType: 'XOX', liteCount: 3, imagePath: '/images/configs/slider-xox.png', sortOrder: 5 },
    { name: 'Casement Left', category: 'window', operationType: 'CL', liteCount: 1, imagePath: '/images/configs/casement-left.png', sortOrder: 6 },
    { name: 'Casement Right', category: 'window', operationType: 'CR', liteCount: 1, imagePath: '/images/configs/casement-right.png', sortOrder: 7 },
    { name: 'Awning', category: 'window', operationType: 'AW', liteCount: 1, imagePath: '/images/configs/awning.png', sortOrder: 8 },
    { name: 'Picture', category: 'window', operationType: 'PIC', liteCount: 1, imagePath: '/images/configs/picture.png', sortOrder: 9 },
  ]).onConflictDoNothing()

  // Product Configs - Doors
  await db.insert(productConfigs).values([
    { name: 'Sliding Patio OX', category: 'door', operationType: 'OX', liteCount: 2, imagePath: '/images/configs/patio-ox.png', sortOrder: 20 },
    { name: 'Sliding Patio XO', category: 'door', operationType: 'XO', liteCount: 2, imagePath: '/images/configs/patio-xo.png', sortOrder: 21 },
    { name: 'French Door', category: 'door', operationType: 'XX', liteCount: 2, imagePath: '/images/configs/french.png', sortOrder: 22 },
  ]).onConflictDoNothing()

  // Default Disclaimers
  await db.insert(disclaimers).values([
    { description: 'Customer agrees to provide clear access to all window and door locations.', sortOrder: 1, includeByDefault: true },
    { description: 'Final measurements will be taken after contract signing. Minor variations from estimate are possible.', sortOrder: 2, includeByDefault: true },
    { description: 'Permit fees are not included unless otherwise specified.', sortOrder: 3, includeByDefault: true },
    { description: 'Lead time for custom orders is typically 4-6 weeks after final measurements.', sortOrder: 4, includeByDefault: true },
  ]).onConflictDoNothing()

  console.log('Seed complete!')
}

seed()
  .catch(console.error)
  .finally(() => process.exit(0))
