import { OurFileRouter } from "@/app/api/uploadthing/core";
import {
  generateReactHelpers,
  generateUploadDropzone,
} from "@uploadthing/react";

export const UploadDropzone = generateUploadDropzone<OurFileRouter>();
export const { useUploadThing } = generateReactHelpers<OurFileRouter>();
