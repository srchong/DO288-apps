export type PhotoStatus = "pending" | "approved" | "rejected";
export type UploadedBy = "client" | "guest";
export type BackgroundCategory =
  | "wedding"
  | "party"
  | "kids"
  | "corporate"
  | "classic";

// Row types are declared with `type` (not `interface`) so they satisfy the
// `Record<string, unknown>` constraint that supabase-js expects for a schema.

export type ClientRow = {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
};

export type BackgroundRow = {
  id: string;
  name: string;
  category: BackgroundCategory;
  is_free: boolean;
  preview_url: string;
  created_at: string;
};

export type AlbumRow = {
  id: string;
  client_id: string;
  slug: string;
  title: string;
  event_type: string;
  event_date: string | null;
  background_id: string | null;
  allow_guest_uploads: boolean;
  created_at: string;
  updated_at: string;
};

export type PhotoRow = {
  id: string;
  album_id: string;
  client_id: string;
  r2_key_original: string;
  r2_key_thumb: string;
  r2_key_pano: string | null;
  is_360: boolean;
  width: number;
  height: number;
  status: PhotoStatus;
  uploaded_by: UploadedBy;
  created_at: string;
};

export type CommentRow = {
  id: string;
  album_id: string;
  photo_id: string | null;
  author_name: string;
  body: string;
  created_at: string;
};

type Table<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      clients: Table<
        ClientRow,
        Pick<ClientRow, "id" | "email"> & Partial<ClientRow>,
        Partial<ClientRow>
      >;
      backgrounds: Table<
        BackgroundRow,
        Omit<BackgroundRow, "id" | "created_at"> & Partial<BackgroundRow>,
        Partial<BackgroundRow>
      >;
      albums: Table<
        AlbumRow,
        Omit<AlbumRow, "id" | "created_at" | "updated_at"> & Partial<AlbumRow>,
        Partial<AlbumRow>
      >;
      photos: Table<
        PhotoRow,
        Omit<PhotoRow, "id" | "created_at"> & Partial<PhotoRow>,
        Partial<PhotoRow>
      >;
      comments: Table<
        CommentRow,
        Omit<CommentRow, "id" | "created_at"> & Partial<CommentRow>,
        Partial<CommentRow>
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
