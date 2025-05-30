"use client";

import { UploadDropzone } from "@/lib/uploadthing";
import { ClientUploadedFileData } from "uploadthing/types";

interface Props {
  onClientUploadComplete: (files: ClientUploadedFileData<null>[]) => void;
}

export function UploadZone({ onClientUploadComplete }: Props) {
  return (
    <UploadDropzone
      endpoint="pdfAndTxt"
      onClientUploadComplete={onClientUploadComplete}
      onUploadError={(err) => alert(err.message)}
    />
  );
}
