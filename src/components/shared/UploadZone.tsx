"use client";

import { UploadDropzone } from "@/lib/uploadthing";
import { ClientUploadedFileData } from "uploadthing/types";

interface Props {
  onClientUploadComplete: (files: ClientUploadedFileData<null>[]) => void;
  onUploadError?: (error: Error) => void;
  disabled?: boolean;
}

export function UploadZone({
  onClientUploadComplete,
  onUploadError,
  disabled = false,
}: Props) {
  const handleUploadError = (error: Error) => {
    if (onUploadError) {
      onUploadError(error);
    } else {
      // Fallback to alert if no custom error handler
      alert(error.message);
    }
  };

  return (
    <UploadDropzone
      endpoint="pdfAndTxt"
      onClientUploadComplete={onClientUploadComplete}
      onUploadError={handleUploadError}
      disabled={disabled}
      config={{
        mode: "auto",
      }}
      appearance={{
        container: `
          border-2 border-dashed border-border rounded-lg bg-muted/30 
          hover:bg-muted/50 transition-colors p-8 
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `,
        uploadIcon: "text-muted-foreground mb-4",
        label: "text-foreground font-medium text-lg mb-4",
        allowedContent: "text-muted-foreground text-sm mb-4",
        button: `
          !bg-primary !text-primary-foreground 
          hover:!bg-primary/90 !transition-colors 
          !px-6 !py-2 !rounded-md !font-medium
          !border-0 !outline-none !mb-4
          focus:!ring-2 focus:!ring-primary focus:!ring-offset-2
          ${disabled ? "!opacity-50 !cursor-not-allowed" : ""}
        `,
      }}
      content={{
        label: "Drag and drop your file here",
        allowedContent: "PDF, TXT, DOCX files up to 10MB",
        button: disabled ? "Uploading..." : "Choose File",
      }}
    />
  );
}
