"use client";

import { UploadDropzone, useUploadThing } from "@/lib/uploadthing";

export default function Home() {
  const { startUpload } = useUploadThing("pdfAndTxt", {
    onBeforeUploadBegin: (files) => {
      console.log(`Uploading ${files.length} files...`);
      return files;
    },
    onUploadBegin: (name) => {
      console.log(`Starting upload for ${name}...`);
    },
    onClientUploadComplete: (res) => {
      console.log(`Upload complete: ${res.length} files uploaded.`);
    },
    onUploadProgress: (p) => {
      console.log("onUploadProgress", p);
    },
  });

  return (
    <main>
      <UploadDropzone
        endpoint="pdfAndTxt"
        onClientUploadComplete={(res) => {
          console.log("onClientUploadComplete", res);
          alert("Upload complete!");
        }}
        onUploadError={(err) => {
          alert(err.message);
        }}
      />
      <input
        type="file"
        multiple
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? []);
          await startUpload(files);
        }}
      />
    </main>
  );
}
