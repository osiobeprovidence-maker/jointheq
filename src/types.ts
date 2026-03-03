export interface User {
  id: number;
  email: string;
  phone: string;
  full_name: string;
  q_score: number;
  consistency_score: number;
  timeliness_score: number;
  stability_score: number;
  wallet_balance: number;
  boot_balance: number;
  referral_code: string;
  referred_by?: number;
  is_admin: boolean;
  created_at: string;
}

export interface Device {
  id: number;
  user_id: number;
  name: string;
  type: string;
  last_used: string;
}

export interface Message {
  id: number;
  sender_id: number;
  receiver_id?: number;
  content: string;
  image_data?: string;
  is_from_admin: boolean;
  created_at: string;
}

export interface Campaign {
  id: number;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  reward_formula?: string; // Optional for raffle campaigns
  boot_pool_max?: number; // Optional for raffle campaigns
  boots_issued?: number; // Optional for raffle campaigns
  status: string;
  type: 'standard' | 'raffle'; // New: type of campaign
  raffle_cost?: number; // New: cost per raffle ticket
  raffle_prize?: string; // New: description of raffle prize
}

export interface SlotType {
  id: number;
  subscription_id: number;
  name: string;
  price: number;
  device_limit: number;
  downloads_enabled: boolean;
  min_q_score: number;
}

export interface Subscription {
  id: number;
  name: string;
  description: string;
  base_cost: number;
  is_active: boolean;
  slot_types: SlotType[];
}

export interface UserSlot {
  id: number;
  group_id: number;
  slot_type_id: number;
  user_id: number;
  status: string;
  renewal_date: string;
  slot_name: string;
  sub_name: string;
  price: number;
  allocation?: string;
}
