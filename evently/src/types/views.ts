import type { PhotoStatus, UploadedBy } from "./database";

// Client-facing photo shape: R2 object keys are resolved to public URLs on the
// server before being handed to client components.
export interface PhotoView {
  id: string;
  thumbUrl: string;
  originalUrl: string;
  panoUrl: string | null;
  is360: boolean;
  status: PhotoStatus;
  uploadedBy: UploadedBy;
}
