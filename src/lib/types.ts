export type ProductStatus = "draft" | "published" | "archived";
export type UserRole = "admin" | "manager" | "editor";
export type OrderStatus =
  | "pending_contact" | "awaiting_confirmation" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";

export interface Category {
  id: string; name: string; slug: string; description: string | null; image_url: string | null;
  is_active: boolean; sort_order: number;
}
export interface Variant {
  id: string; product_id: string; sku: string | null; size: string | null; color: string | null;
  price_override_cents: number | null; stock_quantity: number; is_active: boolean;
}
export interface ProductImage { id: string; product_id: string; image_url: string; alt_text: string; sort_order: number }
export interface Product {
  id: string; name: string; slug: string; short_description: string | null; description: string | null;
  category_id: string | null; base_price_cents: number; sale_price_cents: number | null;
  sale_starts_at: string | null; sale_ends_at: string | null; sku: string | null; status: ProductStatus;
  is_featured: boolean; badge: string | null; size_guide: string | null; care_instructions: string | null;
  is_demo: boolean; seo_title: string | null; seo_description: string | null; created_at: string;
}
export interface ProductWithRelations extends Product {
  product_images: ProductImage[]; product_variants: Variant[]; categories?: Pick<Category, "name" | "slug"> | null;
}
export interface Coupon {
  id: string; code: string; discount_type: "percent" | "fixed"; discount_value: number;
  minimum_order_cents: number; usage_limit: number | null; usage_count: number;
  starts_at: string | null; expires_at: string | null; eligible_product_ids: string[];
  eligible_category_ids: string[]; is_active: boolean;
}
export interface Benefit { title: string; description: string }
export interface EditorialBlock { title: string; text: string; image_url: string | null; link: string | null }
export interface SocialPost { image_url: string; link_url: string; alt: string }
export interface StoreSettings {
  store_name: string; tagline: string | null; logo_url: string | null; favicon_url: string | null;
  theme_primary: string; theme_accent: string; theme_dark: string; whatsapp_number: string | null;
  contact_email: string | null; address: string | null; instagram_url: string | null; facebook_url: string | null;
  tiktok_url: string | null; youtube_url: string | null; promo_bar_enabled: boolean; promo_bar_text: string | null;
  promo_bar_link: string | null; free_shipping_threshold_cents: number | null; delivery_info: string | null;
  returns_text: string | null; management_text: string | null; privacy_text: string | null; terms_text: string | null;
  hero_title: string; hero_subtitle: string; hero_cta_label: string; hero_cta_link: string;
  hero_secondary_label: string; hero_secondary_link: string; hero_image_url: string | null;
  hero_image_mobile_url: string | null; featured_title: string; benefits: Benefit[]; editorial: EditorialBlock[];
  social_gallery: SocialPost[]; low_stock_threshold: number; seo_title: string | null; seo_description: string | null;
}
