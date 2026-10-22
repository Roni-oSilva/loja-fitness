import type { Metadata } from "next";
import { MyOrders } from "@/features/orders/my-orders";

export const metadata: Metadata = { title: "Meus pedidos", robots: { index: false } };
export default function Page() { return <MyOrders />; }
