export interface HistoryEntry {
  amount: number;
  type: string;
  description: string;
  created_at: number;
}

export interface PenaltyEntry {
  score_penalty: number;
  boots_penalty: number;
  type: string;
  description: string;
  created_at: number;
}

export interface User {
  _id: string;
  email: string;
  phone?: string;
  full_name: string;
  q_score: number;
  q_rank: string;
  wallet_balance: number;
  boots_balance: number;
  referral_code: string;
  referred_by?: string;
  score_history?: HistoryEntry[];
  boots_history?: HistoryEntry[];
  penalty_history?: PenaltyEntry[];
  is_admin: boolean;
  role?: string;
  is_verified: boolean;
  created_at: number;
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
  _id: string;
  subscription_id: string;
  name: string;
  price: number;
  device_limit: number;
  downloads_enabled: boolean;
  min_q_score: number;
}

export interface Subscription {
  _id: string;
  name: string;
  description: string;
  base_cost: number;
  is_active: boolean;
  slot_types: SlotType[];
}

export interface UserSlot {
  _id: string;
  group_id: string;
  slot_type_id: string;
  user_id?: string;
  status: string;
  renewal_date: string;
  slot_name: string;
  sub_name: string;
  price: number;
  allocation?: string;
}
export interface LunarMemory {
  _id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  date: string;
  created_at: number;
}

export interface LunarStatus {
  is_subscribed: boolean;
  tier: string;
  expires_at?: number;
}
