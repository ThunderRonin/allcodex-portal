import { createImageUpload } from "novel";

const onUpload = (file: File) => {
  const promise = fetch("/api/lore/upload-image", {
    method: "POST",
    headers: {
      "content-type": file?.type || "application/octet-stream",
      "x-vercel-filename": file?.name || "image.png",
    },
    body: file,
  });

  return new Promise<{ url: string }>((resolve, reject) => {
    promise
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("Failed to upload image");
        }
        const data = await res.json();
        // The endpoint should return { url: string, noteId: string }
        resolve({ url: data.url });
      })
      .catch((err) => {
        reject(err);
      });
  });
};

export const uploadFn = createImageUpload({
  onUpload,
  validateFn: (file) => {
    if (!file.type.includes("image/")) {
      return false;
    }
    // Limit size to 10MB
    if (file.size > 10 * 1024 * 1024) {
      return false;
    }
    return true;
  },
});
