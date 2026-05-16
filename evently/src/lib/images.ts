import convert from "heic-convert";
import sharp from "sharp";

export const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB

export const ACCEPTED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/heic",
  "image/heif",
  "image/gif",
];

const THUMB_WIDTH = 600;
const PANO_MAX_WIDTH = 4096;
const PANO_ASPECT = 2;
const ASPECT_TOLERANCE = 0.02;

export interface ProcessedAsset {
  buffer: Buffer;
  contentType: string;
  extension: string;
}

export interface ProcessedImage {
  original: ProcessedAsset;
  thumbnail: ProcessedAsset;
  /** Reduced 4096px WebP, only generated for equirectangular 360° photos. */
  pano: ProcessedAsset | null;
  is360: boolean;
  width: number;
  height: number;
}

function isHeic(buffer: Buffer, filename: string): boolean {
  if (/\.hei[cf]$/i.test(filename)) return true;
  // ISO base media file format: bytes 4-8 are "ftyp", the brand follows.
  if (buffer.length < 12) return false;
  if (buffer.toString("ascii", 4, 8) !== "ftyp") return false;
  const brand = buffer.toString("ascii", 8, 12);
  return [
    "heic",
    "heix",
    "hevc",
    "hevx",
    "heim",
    "heis",
    "mif1",
    "msf1",
  ].includes(brand);
}

// A 360° panorama is detected by a 2:1 aspect ratio together with the XMP
// GPano metadata that marks the projection as equirectangular.
function hasGPanoEquirectangular(xmp: Buffer | undefined): boolean {
  if (!xmp) return false;
  const text = xmp.toString("utf8");
  return text.includes("GPano") && /equirectangular/i.test(text);
}

function extensionFor(filename: string, format?: string): string {
  if (format === "jpeg") return "jpg";
  if (format) return format;
  const match = filename.match(/\.([a-z0-9]+)$/i);
  return match ? match[1].toLowerCase() : "bin";
}

function contentTypeFor(filename: string, format?: string): string {
  const ext = extensionFor(filename, format);
  const map: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
    avif: "image/avif",
  };
  return map[ext] ?? "application/octet-stream";
}

export async function processImage(
  input: Buffer,
  filename: string,
): Promise<ProcessedImage> {
  // iPhone HEIC is rasterized to JPEG so sharp can read it reliably.
  let working = input;
  let originalIsHeic = false;
  if (isHeic(input, filename)) {
    const arrayBuffer = input.buffer.slice(
      input.byteOffset,
      input.byteOffset + input.byteLength,
    ) as ArrayBuffer;
    const decoded = await convert({
      buffer: arrayBuffer,
      format: "JPEG",
      quality: 0.92,
    });
    working = Buffer.from(decoded);
    originalIsHeic = true;
  }

  const metadata = await sharp(working, { failOn: "none" }).metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;

  const aspectIs2to1 =
    width > 0 &&
    height > 0 &&
    Math.abs(width / height - PANO_ASPECT) < ASPECT_TOLERANCE;
  const is360 = aspectIs2to1 && hasGPanoEquirectangular(metadata.xmp);

  const thumbnailBuffer = await sharp(working)
    .rotate()
    .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
    .webp({ quality: 78 })
    .toBuffer();

  let pano: ProcessedAsset | null = null;
  if (is360) {
    const panoBuffer = await sharp(working)
      .resize({ width: PANO_MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    pano = {
      buffer: panoBuffer,
      contentType: "image/webp",
      extension: "webp",
    };
  }

  let original: ProcessedAsset;
  if (originalIsHeic) {
    // HEIC is converted to WebP per the project image rules.
    const webp = await sharp(working).webp({ quality: 90 }).toBuffer();
    original = { buffer: webp, contentType: "image/webp", extension: "webp" };
  } else {
    original = {
      buffer: input,
      contentType: contentTypeFor(filename, metadata.format),
      extension: extensionFor(filename, metadata.format),
    };
  }

  return {
    original,
    thumbnail: {
      buffer: thumbnailBuffer,
      contentType: "image/webp",
      extension: "webp",
    },
    pano,
    is360,
    width,
    height,
  };
}
