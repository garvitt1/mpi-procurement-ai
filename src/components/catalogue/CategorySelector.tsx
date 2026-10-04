import React, { useRef } from "react"
import { CatalogCategory } from "../../lib/mpiCatalog"
import { CategoryMetadata } from "./catalogue.types"
import MaterialIcon from "../ui/MaterialIcon"

interface CategorySelectorProps {
  categories: CategoryMetadata[]
  selectedCategory: CatalogCategory
  onSelectCategory: (category: CatalogCategory) => void
  productCounts: Record<CatalogCategory, number>
  disabled?: boolean
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  productCounts,
  disabled = false,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const handleSelect = (category: CatalogCategory) => {
    if (disabled || category === selectedCategory) return
    onSelectCategory(category)
  }

  return (
    <div className="relative w-full">
      {/* Category Tabs Rail (Horizontal Scrollable on all viewports with smooth momentum) */}
      <div
        ref={scrollContainerRef}
        role="tablist"
        aria-label="Procurement Categories"
        className="flex items-stretch gap-3 overflow-x-auto pb-2 pt-1 px-1 no-scrollbar scroll-smooth snap-x snap-mandatory focus:outline-none"
      >
        {categories.map((cat) => {
          const isActive = cat.id === selectedCategory
          const count = productCounts[cat.id] || 0

          return (
            <button
              key={cat.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${cat.id}`}
              disabled={disabled}
              onClick={() => handleSelect(cat.id)}
              className={`group relative shrink-0 text-left rounded-2xl px-4 py-3.5 transition-all duration-300 cursor-pointer snap-start select-none border ${
                isActive
                  ? "bg-[#0B1F4B] border-[#0B1F4B] text-white shadow-[0_12px_24px_-8px_rgba(11,31,75,0.35)] scale-[1.01]"
                  : "bg-white hover:bg-slate-50/80 border-slate-200 text-slate-800 hover:border-slate-300 shadow-2xs"
              } min-w-[210px] sm:min-w-[240px] max-w-[280px] flex flex-col justify-between`}
            >
              {/* Active Orange Accent Pill at Top Right */}
              {isActive && (
                <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-[#F97316] ring-4 ring-orange-400/20 animate-pulse" />
              )}

              <div>
                {/* Header: Icon + Product Count Badge */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                      isActive
                        ? "bg-white/15 text-[#F97316]"
                        : "bg-blue-50/80 text-[#0B1F4B] group-hover:bg-blue-100"
                    }`}
                  >
                    <MaterialIcon name={cat.iconName} size={20} />
                  </div>

                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      isActive
                        ? "bg-white/15 text-orange-200"
                        : "bg-slate-100 text-slate-600 group-hover:bg-slate-200/70"
                    }`}
                  >
                    {count} {count === 1 ? "Offering" : "Offerings"}
                  </span>
                </div>

                {/* Category Display Name */}
                <div
                  className={`text-sm font-bold tracking-tight mb-1 transition-colors ${
                    isActive ? "text-white" : "text-slate-900 group-hover:text-[#0B1F4B]"
                  }`}
                  style={{ fontFamily: "Plus Jakarta Sans" }}
                >
                  {cat.displayName}
                </div>

                {/* Subtitle / Key Deliverables */}
                <p
                  className={`text-[11px] leading-tight line-clamp-1 transition-colors ${
                    isActive ? "text-blue-100/90" : "text-slate-500"
                  }`}
                >
                  {cat.subtitle}
                </p>
              </div>

              {/* Bottom active indicator bar */}
              <div className="mt-3 pt-2 border-t border-slate-100/20 flex items-center justify-between text-[10px] font-semibold">
                <span className={isActive ? "text-orange-300" : "text-slate-400"}>
                  {isActive ? "Active View" : "Explore →"}
                </span>
                <span className={isActive ? "text-white/60 text-[9px]" : "text-slate-300 text-[9px]"}>
                  MPI Verified
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
export default CategorySelector
