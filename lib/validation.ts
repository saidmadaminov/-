import { z } from "zod";

export const phoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[^\d+]/g, ""))
  .refine((v) => /^\+?\d{9,15}$/.test(v), "Некорректный телефон");

export const registerSchema = z.object({
  phone: phoneSchema.optional(),
  email: z.string().email().optional(),
  password: z.string().min(6, "Пароль минимум 6 символов"),
  name: z.string().trim().min(2, "Укажите имя"),
  role: z.enum(["CUSTOMER", "BUSINESS", "SPECIALIST"]),
  locale: z.enum(["ru", "en"]).default("ru"),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
  cityId: z.number().int().optional().nullable(),
  profession: z.string().trim().optional(),
})
  .refine((v) => v.phone || v.email, "Укажите телефон или email");

export const loginSchema = z.object({
  login: z.string().trim().min(3),
  password: z.string().min(1),
});

export const reviewSchema = z.object({
  targetType: z.enum(["PRODUCT", "SERVICE", "BUSINESS", "SPECIALIST"]),
  targetId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  quality: z.number().int().min(1).max(5).optional(),
  accuracy: z.number().int().min(1).max(5).optional(),
  speed: z.number().int().min(1).max(5).optional(),
  communication: z.number().int().min(1).max(5).optional(),
  priceScore: z.number().int().min(1).max(5).optional(),
  comment: z.string().trim().max(2000).optional(),
});

export const productSchema = z.object({
  title: z.string().trim().min(3),
  categoryId: z.number().int().optional().nullable(),
  price: z.number().int().min(0),
  description: z.string().trim().max(5000).optional(),
  condition: z.enum(["NEW", "USED"]).default("NEW"),
  status: z.enum(["AVAILABLE", "OUT_OF_STOCK", "HIDDEN"]).default("AVAILABLE"),
  quantity: z.number().int().min(0).default(1),
  address: z.string().trim().optional(),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
  images: z.array(z.string()).optional(),
});

export const serviceSchema = z.object({
  title: z.string().trim().min(3),
  categoryId: z.number().int().optional().nullable(),
  description: z.string().trim().max(5000).optional(),
  priceFrom: z.number().int().min(0).optional().nullable(),
  priceTo: z.number().int().min(0).optional().nullable(),
  durationMin: z.number().int().min(0).optional().nullable(),
  isOnSite: z.boolean().default(false),
  district: z.string().trim().optional(),
  availability: z.string().trim().optional(),
  images: z.array(z.string()).optional(),
});

export const complaintSchema = z.object({
  targetType: z.enum(["PRODUCT", "SERVICE", "BUSINESS", "SPECIALIST"]),
  targetId: z.string().min(1),
  reason: z.enum([
    "FRAUD", "FALSE_INFO", "WRONG_PRICE", "NOT_EXISTS", "BAD_QUALITY", "BEHAVIOR", "RULES",
  ]),
  description: z.string().trim().max(2000).optional(),
});

export const verificationSchema = z.object({
  targetType: z.enum(["BUSINESS", "SPECIALIST"]),
  note: z.string().trim().max(2000).optional(),
  documents: z
    .array(z.object({ docType: z.enum(["REGISTRATION", "IDENTITY", "CERTIFICATE", "ADDRESS", "OTHER"]), fileUrl: z.string().min(1) }))
    .min(1, "Загрузите хотя бы один документ"),
});
