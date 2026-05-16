"use client";

import { ReactPhotoSphereViewer } from "react-photo-sphere-viewer";

// Loaded via next/dynamic with { ssr: false } — three.js must not run on the
// server and should not be bundled into pages that do not show 360° photos.
export default function Sphere360Viewer({ src }: { src: string }) {
  return (
    <ReactPhotoSphereViewer
      src={src}
      height="100%"
      width="100%"
      containerClass="size-full"
      navbar={["zoom", "fullscreen"]}
    />
  );
}
