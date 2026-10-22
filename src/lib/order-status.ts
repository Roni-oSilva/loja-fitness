import type { OrderStatus } from "./types";

export const ORDER_STATUSES: OrderStatus[] = [
  "pending_contact", "awaiting_confirmation", "confirmed", "processing", "shipped", "delivered", "cancelled",
];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending_contact: "Aguardando contato",
  awaiting_confirmation: "Aguardando confirmação",
  confirmed: "Confirmado",
  processing: "Em preparação",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

/** Espelha public.order_transition_allowed (o banco é a autoridade final). */
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_contact: ["awaiting_confirmation", "confirmed", "cancelled"],
  awaiting_confirmation: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

export const nextStatuses = (from: OrderStatus): OrderStatus[] => TRANSITIONS[from];
export const canTransition = (from: OrderStatus, to: OrderStatus) => TRANSITIONS[from].includes(to);
/** Pedidos que contam como vendas confirmadas (não são "recebidos"). */
export const CONFIRMED_STATUSES: OrderStatus[] = ["confirmed", "processing", "shipped", "delivered"];
