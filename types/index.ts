// Центральные типы домена. Статусы хранятся строками в SQLite, но типизированы здесь.

export const ROLES = ["CUSTOMER", "BUSINESS", "SPECIALIST", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS_RU: Record<Role, string> = {
  CUSTOMER: "Покупатель",
  BUSINESS: "Бизнес",
  SPECIALIST: "Специалист",
  ADMIN: "Администратор",
};

export const TARGET_TYPES = ["PRODUCT", "SERVICE", "BUSINESS", "SPECIALIST"] as const;
export type TargetType = (typeof TARGET_TYPES)[number];

export const VERIFICATION_STATUSES = ["NONE", "PENDING", "VERIFIED", "REJECTED", "SUSPENDED"] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const ORDER_STATUSES = ["NEW", "ACCEPTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export const ORDER_STATUS_LABELS_RU: Record<OrderStatus, string> = {
  NEW: "Новый",
  ACCEPTED: "Принят",
  IN_PROGRESS: "В работе",
  COMPLETED: "Выполнен",
  CANCELLED: "Отменён",
};
/** Допустимые переходы статусов заказа (для продавца). */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  NEW: ["ACCEPTED", "CANCELLED"],
  ACCEPTED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export const PRODUCT_STATUSES = ["AVAILABLE", "OUT_OF_STOCK", "HIDDEN"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];
export const PRODUCT_STATUS_LABELS_RU: Record<ProductStatus, string> = {
  AVAILABLE: "В наличии",
  OUT_OF_STOCK: "Нет в наличии",
  HIDDEN: "Скрыт",
};

export const CONDITIONS = ["NEW", "USED"] as const;
export type Condition = (typeof CONDITIONS)[number];

export const SORT_OPTIONS = [
  "recommended",
  "distance",
  "price_asc",
  "price_desc",
  "rating",
  "value",
  "in_stock",
  "open_now",
] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

export const COMPLAINT_REASONS = [
  "FRAUD",
  "FALSE_INFO",
  "WRONG_PRICE",
  "NOT_EXISTS",
  "BAD_QUALITY",
  "BEHAVIOR",
  "RULES",
] as const;
export type ComplaintReason = (typeof COMPLAINT_REASONS)[number];
export const COMPLAINT_REASON_LABELS_RU: Record<ComplaintReason, string> = {
  FRAUD: "Мошенничество",
  FALSE_INFO: "Ложная информация",
  WRONG_PRICE: "Неправильная цена",
  NOT_EXISTS: "Несуществующий товар/услуга",
  BAD_QUALITY: "Плохое качество",
  BEHAVIOR: "Неподобающее поведение",
  RULES: "Нарушение правил",
};

/** Нормализованное предложение для единого поиска/карты/ленты. */
export interface UnifiedOffer {
  id: string;
  type: TargetType;
  title: string;
  description?: string | null;
  price?: number | null;
  priceFrom?: number | null;
  priceTo?: number | null;
  currency: "KGS";
  image?: string | null;
  categoryName?: string | null;
  categoryIcon?: string;
  rating: number;
  reviewCount: number;
  verified: boolean;
  isPromoted: boolean;
  isDemo: boolean;
  distanceKm?: number | null;
  lat?: number | null;
  lng?: number | null;
  inStock?: boolean;
  openNow?: boolean;
  ownerId?: string | null;
  ownerName?: string | null;
  score?: number;
  activeNow?: boolean;
  lowRating?: boolean;
  createdAt?: Date;
}

export interface MapPoint {
  id: string;
  type: TargetType;
  title: string;
  price?: number | null;
  priceFrom?: number | null;
  rating: number;
  reviewCount: number;
  verified: boolean;
  lat: number;
  lng: number;
  categoryName?: string | null;
  icon?: string;
}

export interface SessionPayload {
  userId: string;
  role: Role;
  name: string;
}
