// MPI marketplace catalog sourced from the approved MPI Products and Services list.
// Fabrication & Hardware, Logistics & Operations are intentionally excluded from the homepage catalog.

export interface CatalogService {
  id: string
  name: string
  category: string
  description: string
  image: string
}

export const CATALOG_CATEGORIES = [
  "Packaging & Printing",
  "Prototyping & Product Development",
  "IT & Digital Services",
  "Compliance & Legal Support",
  "Marketing & Sales Support",
  "Business & Finance Services",
  "Specialized Startup Support",
] as const

export type CatalogCategory = typeof CATALOG_CATEGORIES[number]

export const MPI_CATALOG: CatalogService[] = [
  // Packaging & Printing
  {
    id: "svc-custom-cartons",
    name: "Custom cartons",
    category: "Packaging & Printing",
    description:
      "Custom cartons services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/custom,cartons?lock=1",
  },
  {
    id: "svc-corrugated-boxes",
    name: "Corrugated boxes",
    category: "Packaging & Printing",
    description:
      "Corrugated boxes services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/corrugated,boxes?lock=2",
  },
  {
    id: "svc-folding-cartons",
    name: "Folding cartons",
    category: "Packaging & Printing",
    description:
      "Folding cartons services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/folding,cartons?lock=3",
  },
  {
    id: "svc-rigid-boxes",
    name: "Rigid boxes",
    category: "Packaging & Printing",
    description:
      "Rigid boxes services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/rigid,boxes?lock=4",
  },
  {
    id: "svc-product-labels",
    name: "Product labels",
    category: "Packaging & Printing",
    description:
      "Product labels services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/product,labels?lock=5",
  },
  {
    id: "svc-barcode-stickers",
    name: "Barcode stickers",
    category: "Packaging & Printing",
    description:
      "Barcode stickers services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/barcode,stickers?lock=6",
  },
  {
    id: "svc-tamper-evident-seals",
    name: "Tamper-evident seals",
    category: "Packaging & Printing",
    description:
      "Tamper-evident seals services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/tamper,evident,seals?lock=7",
  },
  {
    id: "svc-pouches-and-sachets",
    name: "Pouches and sachets",
    category: "Packaging & Printing",
    description:
      "Pouches and sachets services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/pouches,and,sachets?lock=8",
  },
  {
    id: "svc-blister-packaging",
    name: "Blister packaging",
    category: "Packaging & Printing",
    description:
      "Blister packaging services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/blister,packaging?lock=9",
  },
  {
    id: "svc-shrink-wrapping",
    name: "Shrink wrapping",
    category: "Packaging & Printing",
    description:
      "Shrink wrapping services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/shrink,wrapping?lock=10",
  },
  {
    id: "svc-stretch-film",
    name: "Stretch film",
    category: "Packaging & Printing",
    description:
      "Stretch film services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/stretch,film?lock=11",
  },
  {
    id: "svc-bubble-wrap",
    name: "Bubble wrap",
    category: "Packaging & Printing",
    description:
      "Bubble wrap services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/bubble,wrap?lock=12",
  },
  {
    id: "svc-thermal-tags",
    name: "Thermal tags",
    category: "Packaging & Printing",
    description:
      "Thermal tags services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/thermal,tags?lock=13",
  },
  {
    id: "svc-instruction-leaflets",
    name: "Instruction leaflets",
    category: "Packaging & Printing",
    description:
      "Instruction leaflets services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/instruction,leaflets?lock=14",
  },
  {
    id: "svc-brochures-and-catalogs",
    name: "Brochures and catalogs",
    category: "Packaging & Printing",
    description:
      "Brochures and catalogs services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/brochures,and,catalogs?lock=15",
  },

  // Prototyping & Product Development
  {
    id: "svc-3d-printing",
    name: "3D printing",
    category: "Prototyping & Product Development",
    description:
      "3D printing services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/3d,printing?lock=16",
  },
  {
    id: "svc-rapid-prototyping",
    name: "Rapid prototyping",
    category: "Prototyping & Product Development",
    description:
      "Rapid prototyping services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/rapid,prototyping?lock=17",
  },
  {
    id: "svc-cad-design",
    name: "CAD design",
    category: "Prototyping & Product Development",
    description:
      "CAD design services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/cad,design?lock=18",
  },
  {
    id: "svc-industrial-design",
    name: "Industrial design",
    category: "Prototyping & Product Development",
    description:
      "Industrial design services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/industrial,design?lock=19",
  },
  {
    id: "svc-model-making",
    name: "Model making",
    category: "Prototyping & Product Development",
    description:
      "Model making services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/model,making?lock=20",
  },
  {
    id: "svc-electronics-prototyping",
    name: "Electronics prototyping",
    category: "Prototyping & Product Development",
    description:
      "Electronics prototyping services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/electronics,prototyping?lock=21",
  },
  {
    id: "svc-pcb-assembly",
    name: "PCB assembly",
    category: "Prototyping & Product Development",
    description:
      "PCB assembly services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/pcb,assembly?lock=22",
  },
  {
    id: "svc-iot-hardware-development",
    name: "IoT hardware development",
    category: "Prototyping & Product Development",
    description:
      "IoT hardware development services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/iot,hardware,development?lock=23",
  },
  {
    id: "svc-mechanical-design",
    name: "Mechanical design",
    category: "Prototyping & Product Development",
    description:
      "Mechanical design services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/mechanical,design?lock=24",
  },
  {
    id: "svc-testing-samples",
    name: "Testing samples",
    category: "Prototyping & Product Development",
    description:
      "Testing samples services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/testing,samples?lock=25",
  },

  // IT & Digital Services
  {
    id: "svc-website-development",
    name: "Website development",
    category: "IT & Digital Services",
    description:
      "Website development services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/website,development?lock=26",
  },
  {
    id: "svc-mobile-app-development",
    name: "Mobile app development",
    category: "IT & Digital Services",
    description:
      "Mobile app development services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/mobile,app,development?lock=27",
  },
  {
    id: "svc-ui-ux-design",
    name: "UI/UX design",
    category: "IT & Digital Services",
    description:
      "UI/UX design services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/ui,ux,design?lock=28",
  },
  {
    id: "svc-erp-setup",
    name: "ERP setup",
    category: "IT & Digital Services",
    description:
      "ERP setup services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/erp,setup?lock=29",
  },
  {
    id: "svc-crm-setup",
    name: "CRM setup",
    category: "IT & Digital Services",
    description:
      "CRM setup services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/crm,setup?lock=30",
  },
  {
    id: "svc-software-qa-testing",
    name: "Software QA testing",
    category: "IT & Digital Services",
    description:
      "Software QA testing services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/software,qa,testing?lock=31",
  },
  {
    id: "svc-cloud-hosting-setup",
    name: "Cloud hosting setup",
    category: "IT & Digital Services",
    description:
      "Cloud hosting setup services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/cloud,hosting,setup?lock=32",
  },
  {
    id: "svc-cybersecurity-audit",
    name: "Cybersecurity audit",
    category: "IT & Digital Services",
    description:
      "Cybersecurity audit services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/cybersecurity,audit?lock=33",
  },
  {
    id: "svc-api-integration",
    name: "API integration",
    category: "IT & Digital Services",
    description:
      "API integration services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/api,integration?lock=34",
  },
  {
    id: "svc-data-entry-and-digitization",
    name: "Data entry and digitization",
    category: "IT & Digital Services",
    description:
      "Data entry and digitization services and supplier discovery through the MPI procurement ecosystem.",
    image:
      "https://loremflickr.com/720/480/data,entry,and,digitization?lock=35",
  },

  // Compliance & Legal Support
  {
    id: "svc-company-incorporation-support",
    name: "Company incorporation support",
    category: "Compliance & Legal Support",
    description:
      "Company incorporation support services and supplier discovery through the MPI procurement ecosystem.",
    image:
      "https://loremflickr.com/720/480/company,incorporation,support?lock=36",
  },
  {
    id: "svc-udyam-registration-support",
    name: "Udyam registration support",
    category: "Compliance & Legal Support",
    description:
      "Udyam registration support services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/udyam,registration,support?lock=37",
  },
  {
    id: "svc-gst-filing",
    name: "GST filing",
    category: "Compliance & Legal Support",
    description:
      "GST filing services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/gst,filing?lock=38",
  },
  {
    id: "svc-tds-filing",
    name: "TDS filing",
    category: "Compliance & Legal Support",
    description:
      "TDS filing services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/tds,filing?lock=39",
  },
  {
    id: "svc-roc-compliance",
    name: "ROC compliance",
    category: "Compliance & Legal Support",
    description:
      "ROC compliance services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/roc,compliance?lock=40",
  },
  {
    id: "svc-trademark-filing",
    name: "Trademark filing",
    category: "Compliance & Legal Support",
    description:
      "Trademark filing services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/trademark,filing?lock=41",
  },
  {
    id: "svc-copyright-filing",
    name: "Copyright filing",
    category: "Compliance & Legal Support",
    description:
      "Copyright filing services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/copyright,filing?lock=42",
  },
  {
    id: "svc-patent-drafting-support",
    name: "Patent drafting support",
    category: "Compliance & Legal Support",
    description:
      "Patent drafting support services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/patent,drafting,support?lock=43",
  },
  {
    id: "svc-iso-certification-support",
    name: "ISO certification support",
    category: "Compliance & Legal Support",
    description:
      "ISO certification support services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/iso,certification,support?lock=44",
  },
  {
    id: "svc-zed-certification-support",
    name: "ZED certification support",
    category: "Compliance & Legal Support",
    description:
      "ZED certification support services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/zed,certification,support?lock=45",
  },

  // Marketing & Sales Support
  {
    id: "svc-brand-identity-design",
    name: "Brand identity design",
    category: "Marketing & Sales Support",
    description:
      "Brand identity design services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/brand,identity,design?lock=46",
  },
  {
    id: "svc-logo-design",
    name: "Logo design",
    category: "Marketing & Sales Support",
    description:
      "Logo design services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/logo,design?lock=47",
  },
  {
    id: "svc-social-media-management",
    name: "Social media management",
    category: "Marketing & Sales Support",
    description:
      "Social media management services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/social,media,management?lock=48",
  },
  {
    id: "svc-performance-marketing",
    name: "Performance marketing",
    category: "Marketing & Sales Support",
    description:
      "Performance marketing services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/performance,marketing?lock=49",
  },
  {
    id: "svc-product-photography",
    name: "Product photography",
    category: "Marketing & Sales Support",
    description:
      "Product photography services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/product,photography?lock=50",
  },
  {
    id: "svc-video-editing",
    name: "Video editing",
    category: "Marketing & Sales Support",
    description:
      "Video editing services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/video,editing?lock=51",
  },
  {
    id: "svc-catalog-design",
    name: "Catalog design",
    category: "Marketing & Sales Support",
    description:
      "Catalog design services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/catalog,design?lock=52",
  },
  {
    id: "svc-sales-deck-design",
    name: "Sales deck design",
    category: "Marketing & Sales Support",
    description:
      "Sales deck design services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/sales,deck,design?lock=53",
  },
  {
    id: "svc-market-research",
    name: "Market research",
    category: "Marketing & Sales Support",
    description:
      "Market research services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/market,research?lock=54",
  },
  {
    id: "svc-lead-generation",
    name: "Lead generation",
    category: "Marketing & Sales Support",
    description:
      "Lead generation services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/lead,generation?lock=55",
  },

  // Business & Finance Services
  {
    id: "svc-accounting",
    name: "Accounting",
    category: "Business & Finance Services",
    description:
      "Accounting services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/accounting?lock=56",
  },
  {
    id: "svc-bookkeeping",
    name: "Bookkeeping",
    category: "Business & Finance Services",
    description:
      "Bookkeeping services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/bookkeeping?lock=57",
  },
  {
    id: "svc-mis-reporting",
    name: "MIS reporting",
    category: "Business & Finance Services",
    description:
      "MIS reporting services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/mis,reporting?lock=58",
  },
  {
    id: "svc-cma-preparation",
    name: "CMA preparation",
    category: "Business & Finance Services",
    description:
      "CMA preparation services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/cma,preparation?lock=59",
  },
  {
    id: "svc-project-report-preparation",
    name: "Project report preparation",
    category: "Business & Finance Services",
    description:
      "Project report preparation services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/project,report,preparation?lock=60",
  },
  {
    id: "svc-valuation-support",
    name: "Valuation support",
    category: "Business & Finance Services",
    description:
      "Valuation support services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/valuation,support?lock=61",
  },
  {
    id: "svc-due-diligence-support",
    name: "Due diligence support",
    category: "Business & Finance Services",
    description:
      "Due diligence support services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/due,diligence,support?lock=62",
  },
  {
    id: "svc-business-analysis",
    name: "Business analysis",
    category: "Business & Finance Services",
    description:
      "Business analysis services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/business,analysis?lock=63",
  },
  {
    id: "svc-payroll-processing",
    name: "Payroll processing",
    category: "Business & Finance Services",
    description:
      "Payroll processing services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/payroll,processing?lock=64",
  },
  {
    id: "svc-virtual-cfo-services",
    name: "Virtual CFO services",
    category: "Business & Finance Services",
    description:
      "Virtual CFO services services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/virtual,cfo,services?lock=65",
  },

  // Specialized Startup Support
  {
    id: "svc-lab-testing",
    name: "Lab testing",
    category: "Specialized Startup Support",
    description:
      "Lab testing services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/lab,testing?lock=66",
  },
  {
    id: "svc-quality-assurance",
    name: "Quality assurance",
    category: "Specialized Startup Support",
    description:
      "Quality assurance services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/quality,assurance?lock=67",
  },
  {
    id: "svc-certification-testing",
    name: "Certification testing",
    category: "Specialized Startup Support",
    description:
      "Certification testing services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/certification,testing?lock=68",
  },
  {
    id: "svc-sample-sourcing",
    name: "Sample sourcing",
    category: "Specialized Startup Support",
    description:
      "Sample sourcing services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/sample,sourcing?lock=69",
  },
  {
    id: "svc-toolroom-support",
    name: "Toolroom support",
    category: "Specialized Startup Support",
    description:
      "Toolroom support services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/toolroom,support?lock=70",
  },
  {
    id: "svc-packaging-design-consultation",
    name: "Packaging design consultation",
    category: "Specialized Startup Support",
    description:
      "Packaging design consultation services and supplier discovery through the MPI procurement ecosystem.",
    image:
      "https://loremflickr.com/720/480/packaging,design,consultation?lock=71",
  },
  {
    id: "svc-procurement-advisory",
    name: "Procurement advisory",
    category: "Specialized Startup Support",
    description:
      "Procurement advisory services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/procurement,advisory?lock=72",
  },
  {
    id: "svc-vendor-onboarding",
    name: "Vendor onboarding",
    category: "Specialized Startup Support",
    description:
      "Vendor onboarding services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/vendor,onboarding?lock=73",
  },
  {
    id: "svc-b2b-sourcing-coordination",
    name: "B2B sourcing coordination",
    category: "Specialized Startup Support",
    description:
      "B2B sourcing coordination services and supplier discovery through the MPI procurement ecosystem.",
    image: "https://loremflickr.com/720/480/b2b,sourcing,coordination?lock=74",
  },
  {
    id: "svc-custom-small-batch-manufacturing",
    name: "Custom small-batch manufacturing",
    category: "Specialized Startup Support",
    description:
      "Custom small-batch manufacturing services and supplier discovery through the MPI procurement ecosystem.",
    image:
      "https://loremflickr.com/720/480/custom,small,batch,manufacturing?lock=75",
  },
]

export function searchCatalog(
  services: CatalogService[],
  query: string,
  category: string | "All",
): CatalogService[] {
  const q = query.trim().toLowerCase()
  return services.filter((service) => {
    const matchesCategory = category === "All" || service.category === category
    const matchesQuery =
      !q ||
      service.name.toLowerCase().includes(q) ||
      service.description.toLowerCase().includes(q) ||
      service.category.toLowerCase().includes(q)
    return matchesCategory && matchesQuery
  })
}
