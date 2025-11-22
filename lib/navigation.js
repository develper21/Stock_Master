export const sidebarNav = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: "LayoutDashboard",
  },
  {
    label: "Products",
    href: "/products",
    icon: "Boxes",
    children: [
      { label: "All Products", href: "/products" },
      { label: "Create Product", href: "/products/create" },
      { label: "Categories", href: "/products/categories" },
    ],
  },
  {
    label: "Receipts",
    href: "/receipts",
    icon: "PackagePlus",
  },
  {
    label: "Deliveries",
    href: "/deliveries",
    icon: "PackageMinus",
  },
  {
    label: "Transfers",
    href: "/transfers",
    icon: "RefreshCw",
  },
  {
    label: "Move History",
    href: "/ledger",
    icon: "History",
  },
  {
    label: "Adjustments",
    href: "/adjustments",
    icon: "Sliders",
  },
  {
    label: "Reports",
    href: "/reports",
    icon: "BarChart3",
  },
  {
    label: "Settings",
    href: "/settings/warehouses",
    icon: "Settings",
    children: [
      { label: "Warehouses", href: "/settings/warehouses" },
      { label: "Create Warehouse", href: "/settings/create-warehouse" },
      { label: "Locations", href: "/settings/locations" },
      { label: "Create Location", href: "/settings/create-location" },
    ],
  },
];

export const profileNavItem = {
  label: "Profile",
  href: "/profile/me",
  icon: "UserCircle",
};
