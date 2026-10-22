import { z } from "zod";
import { uuid } from "./common";

export const cartItemSchema = z.object({
  variantId: uuid,
  quantity: z.number().int().min(1).max(99),
});
export type CartItemInput = z.infer<typeof cartItemSchema>;

export const cartSchema = z.object({
  items: z.array(cartItemSchema).min(1, "Seu carrinho está vazio").max(40),
  couponCode: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,32}$/).optional().or(z.literal("").transform(() => undefined)),
});

export const phoneSchema = z.string().trim().transform((v) => v.replace(/\D/g, "")).refine((v) => v === "" || /^[1-9]\d{9,14}$/.test(v), "Telefone inválido (use DDD + número)");

export const checkoutSchema = cartSchema.extend({
  idempotencyKey: z.string().min(16).max(100),
  name: z.string().trim().min(2, "Informe seu nome").max(120),
  phone: phoneSchema.optional(),
  email: z.preprocess((v) => (v === "" ? undefined : v), z.string().trim().email("E-mail inválido").max(254).optional()),
  notes: z.string().trim().max(500).optional(),
  consent: z.literal(true, { error: "É necessário concordar com o uso dos dados para atender o pedido" }),
  // honeypot: campo invisível que humanos não preenchem
  website: z.string().max(0).optional(),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;
