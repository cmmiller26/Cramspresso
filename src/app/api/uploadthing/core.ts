import { createUploadthing, FileRouter } from "uploadthing/next";

const f = createUploadthing({
  errorFormatter: (err) => {
    console.log("Error uploading file", err.message);
    console.log("  - Above error caused by:", err.cause);
    return { message: err.message };
  },
});

export const uploadRouter = {
  pdfAndTxt: f({
    pdf: { maxFileSize: "8MB", maxFileCount: 1 },
    text: { maxFileSize: "8MB", maxFileCount: 1 },
  }).onUploadComplete(({ file }) => {
    console.log("File uploaded successfully:", file.ufsUrl);
  }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;
