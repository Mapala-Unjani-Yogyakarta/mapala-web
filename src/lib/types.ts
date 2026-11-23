export type MemberStatus = "aktif" | "alumni" | "luar_biasa" | "non_aktif";

export type SiteSettings = {
  org_name: string;
  tagline: string;
  about: string;
  vision: string;
  mission: string;
  history: string;
  founded_year: number | null;
  contact_email: string;
  contact_phone: string;
  whatsapp: string;
  instagram: string;
  address: string;
  hero_image_url: string | null;
};

export type Member = {
  id: string;
  full_name: string;
  nickname: string | null;
  member_number: string | null;
  angkatan: string | null;
  status: MemberStatus;
  photo_url: string | null;
  is_public: boolean;
};

/** Data anggota yang boleh tampil publik. */
export type PublicMember = Pick<Member, "id" | "full_name" | "nickname" | "angkatan" | "status" | "photo_url">;

export type MemberPrivate = {
  member_id: string;
  nim: string | null;
  email: string | null;
  phone: string | null;
  blood_type: string | null;
  address: string | null;
  emergency_name: string | null;
  emergency_phone: string | null;
  edit_token: string | null;
};

export type Period = {
  id: string;
  slug: string;
  name: string;
  year_start: number;
  year_end: number;
  theme: string | null;
  vision: string | null;
  is_current: boolean;
};

export type PositionWithMember = {
  id: string;
  title: string;
  division: string | null;
  sort_order: number;
  members: Pick<Member, "id" | "full_name" | "nickname" | "photo_url" | "angkatan">;
};

export type Album = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  event_date: string | null;
  cover_url: string | null;
  is_published: boolean;
};

export type Photo = {
  id: string;
  album_id: string;
  url: string;
  path: string;
  caption: string | null;
};

export type Submission = {
  id: string;
  kind: "baru" | "ubah";
  status: "pending" | "approved" | "rejected";
  member_id: string | null;
  payload: Record<string, string>;
  photo_url: string | null;
  reject_reason: string | null;
  submitted_at: string;
  reviewed_at: string | null;
};
