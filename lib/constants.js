export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^_-])[A-Za-z\d@$!%*?&#^_-]{8,}$/;

export const PASSWORD_REQUIREMENTS = [
  "At least 8 characters",
  "One lowercase letter",
  "One uppercase letter",
  "One digit",
  "One special character (@$!%*?&#^_-)",
];

export const USER_ROLES = [
  { value: "inventory_manager", label: "Inventory Manager" },
  { value: "warehouse_staff", label: "Warehouse Staff" },
];
