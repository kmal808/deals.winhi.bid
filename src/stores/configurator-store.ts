import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface WindowConfig {
  id: string
  customerId: number
  location: string
  category: 'window' | 'door'
  productConfigId: number | null
  productConfigName: string | null
  operationType: string | null
  width: number
  height: number
  brandId: number | null
  brandName: string | null
  frameTypeId: number | null
  frameTypeName: string | null
  frameColorId: number | null
  frameColorName: string | null
  frameColorHex: string | null
  glassTypeId: number | null
  glassTypeName: string | null
  gridStyleId: number | null
  gridStyleName: string | null
  gridSizeId: number | null
  gridSizeName: string | null
  noGrid: boolean
  calculatedPrice: number
}

export type WizardStep =
  | 'category'
  | 'type'
  | 'operation'
  | 'size'
  | 'brand'
  | 'color'
  | 'glass'
  | 'grids'
  | 'review'

const STEP_ORDER: WizardStep[] = [
  'category',
  'type',
  'operation',
  'size',
  'brand',
  'color',
  'glass',
  'grids',
  'review',
]

interface ConfiguratorState {
  // Current configuration being built
  customerId: number | null
  currentStep: WizardStep
  currentConfig: Partial<WindowConfig>

  // Cart of completed configurations
  cart: WindowConfig[]

  // Pricing factors (loaded from DB)
  pricingFactors: {
    brands: Array<{ id: number; name: string; factor: string }>
    frameTypes: Array<{ id: number; name: string; factor: string }>
    frameColors: Array<{ id: number; name: string; hexColor: string; factor: string }>
    glassTypes: Array<{ id: number; name: string; factor: string; imagePath: string | null }>
    gridStyles: Array<{ id: number; name: string; factor: string; imagePath: string | null }>
    gridSizes: Array<{ id: number; size: string }>
    productConfigs: Array<{
      id: number
      name: string
      category: string
      operationType: string | null
      liteCount: number
      imagePath: string | null
    }>
  }

  // Actions
  setCustomerId: (customerId: number) => void
  setPricingFactors: (factors: ConfiguratorState['pricingFactors']) => void
  setStep: (step: WizardStep) => void
  nextStep: () => void
  prevStep: () => void
  updateConfig: (updates: Partial<WindowConfig>) => void
  calculatePrice: () => number
  addToCart: () => void
  removeFromCart: (id: string) => void
  editCartItem: (id: string) => void
  clearCart: () => void
  resetConfig: () => void
}

const initialConfig: Partial<WindowConfig> = {
  location: '',
  category: undefined,
  productConfigId: null,
  productConfigName: null,
  operationType: null,
  width: 36,
  height: 48,
  brandId: null,
  brandName: null,
  frameTypeId: null,
  frameTypeName: null,
  frameColorId: null,
  frameColorName: null,
  frameColorHex: null,
  glassTypeId: null,
  glassTypeName: null,
  gridStyleId: null,
  gridStyleName: null,
  gridSizeId: null,
  gridSizeName: null,
  noGrid: false,
  calculatedPrice: 0,
}

export const useConfiguratorStore = create<ConfiguratorState>()(
  persist(
    (set, get) => ({
      customerId: null,
      currentStep: 'category',
      currentConfig: { ...initialConfig },
      cart: [],
      pricingFactors: {
        brands: [],
        frameTypes: [],
        frameColors: [],
        glassTypes: [],
        gridStyles: [],
        gridSizes: [],
        productConfigs: [],
      },

      setCustomerId: (customerId) => set({ customerId }),

      setPricingFactors: (factors) => set({ pricingFactors: factors }),

      setStep: (step) => set({ currentStep: step }),

      nextStep: () => {
        const { currentStep } = get()
        const currentIndex = STEP_ORDER.indexOf(currentStep)
        if (currentIndex < STEP_ORDER.length - 1) {
          set({ currentStep: STEP_ORDER[currentIndex + 1] })
        }
      },

      prevStep: () => {
        const { currentStep } = get()
        const currentIndex = STEP_ORDER.indexOf(currentStep)
        if (currentIndex > 0) {
          set({ currentStep: STEP_ORDER[currentIndex - 1] })
        }
      },

      updateConfig: (updates) => {
        set((state) => ({
          currentConfig: { ...state.currentConfig, ...updates },
        }))
      },

      calculatePrice: () => {
        const { currentConfig, pricingFactors } = get()
        const { width, height, brandId, frameTypeId, frameColorId, glassTypeId, gridStyleId, noGrid } =
          currentConfig

        if (!width || !height) return 0

        // Find factors
        const brandFactor = parseFloat(
          pricingFactors.brands.find((b) => b.id === brandId)?.factor || '1.0'
        )
        const frameTypeFactor = parseFloat(
          pricingFactors.frameTypes.find((f) => f.id === frameTypeId)?.factor || '1.0'
        )
        const colorFactor = parseFloat(
          pricingFactors.frameColors.find((c) => c.id === frameColorId)?.factor || '1.0'
        )
        const glassFactor = parseFloat(
          pricingFactors.glassTypes.find((g) => g.id === glassTypeId)?.factor || '1.0'
        )
        const gridFactor = noGrid
          ? 1.0
          : parseFloat(
              pricingFactors.gridStyles.find((g) => g.id === gridStyleId)?.factor || '1.0'
            )

        // Price formula: (height + width) × sum of factors
        const totalFactor = brandFactor + frameTypeFactor + colorFactor + glassFactor + gridFactor
        const price = (height + width) * totalFactor

        return Math.round(price * 100) / 100
      },

      addToCart: () => {
        const { currentConfig, customerId, calculatePrice } = get()

        if (!customerId) return

        const newItem: WindowConfig = {
          id: crypto.randomUUID(),
          customerId,
          location: currentConfig.location || `Window ${get().cart.length + 1}`,
          category: currentConfig.category || 'window',
          productConfigId: currentConfig.productConfigId || null,
          productConfigName: currentConfig.productConfigName || null,
          operationType: currentConfig.operationType || null,
          width: currentConfig.width || 36,
          height: currentConfig.height || 48,
          brandId: currentConfig.brandId || null,
          brandName: currentConfig.brandName || null,
          frameTypeId: currentConfig.frameTypeId || null,
          frameTypeName: currentConfig.frameTypeName || null,
          frameColorId: currentConfig.frameColorId || null,
          frameColorName: currentConfig.frameColorName || null,
          frameColorHex: currentConfig.frameColorHex || null,
          glassTypeId: currentConfig.glassTypeId || null,
          glassTypeName: currentConfig.glassTypeName || null,
          gridStyleId: currentConfig.gridStyleId || null,
          gridStyleName: currentConfig.gridStyleName || null,
          gridSizeId: currentConfig.gridSizeId || null,
          gridSizeName: currentConfig.gridSizeName || null,
          noGrid: currentConfig.noGrid || false,
          calculatedPrice: calculatePrice(),
        }

        set((state) => ({
          cart: [...state.cart, newItem],
          currentConfig: { ...initialConfig },
          currentStep: 'category',
        }))
      },

      removeFromCart: (id) => {
        set((state) => ({
          cart: state.cart.filter((item) => item.id !== id),
        }))
      },

      editCartItem: (id) => {
        const { cart } = get()
        const item = cart.find((i) => i.id === id)
        if (item) {
          set({
            currentConfig: { ...item },
            currentStep: 'category',
            cart: cart.filter((i) => i.id !== id),
          })
        }
      },

      clearCart: () => set({ cart: [] }),

      resetConfig: () =>
        set({
          currentConfig: { ...initialConfig },
          currentStep: 'category',
        }),
    }),
    {
      name: 'configurator-storage',
      partialize: (state) => ({
        cart: state.cart,
        customerId: state.customerId,
      }),
    }
  )
)

// Step metadata
export const STEPS: { key: WizardStep; label: string; description: string }[] = [
  { key: 'category', label: 'Category', description: 'Window or Door' },
  { key: 'type', label: 'Type', description: 'Product configuration' },
  { key: 'operation', label: 'Operation', description: 'Opening style' },
  { key: 'size', label: 'Size', description: 'Width and height' },
  { key: 'brand', label: 'Brand', description: 'Manufacturer' },
  { key: 'color', label: 'Color', description: 'Frame color' },
  { key: 'glass', label: 'Glass', description: 'Glass type' },
  { key: 'grids', label: 'Grids', description: 'Grid pattern' },
  { key: 'review', label: 'Review', description: 'Summary' },
]
