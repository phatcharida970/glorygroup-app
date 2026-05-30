export type Customer = {
  id: string; owner_id: string; name: string
  phone: string | null; line_id: string | null
  project_name: string | null; address: string | null; budget: string | null
  style_tags: string[]; color_material_tags: string[]
  dislikes: string | null; rooms: string[]; notes: string | null
  created_at: string; updated_at: string
}

export type Dealer = {
  id: string; owner_id: string; name: string; rating: number | null
  categories: string[]; phone: string | null; line_id: string | null
  location_text: string | null; map_url: string | null
  credit_terms: string | null; shipping_note: string | null
  min_order: string | null; hours: string | null; notes: string | null
  created_at: string; updated_at: string
}

export type Item = {
  id: string; owner_id: string; name: string; unit: string
  category: string | null; notes: string | null
  created_at: string; updated_at: string
}

export type Price = {
  id: string; owner_id: string; item_id: string; dealer_id: string
  price: number; observed_at: string; note: string | null; created_at: string
}

export type Attachment = {
  id: string; owner_id: string
  entity_type: 'customer' | 'dealer'; entity_id: string
  storage_path: string; caption: string | null; sort_order: number; created_at: string
}
