import { useEffect, useRef, useState } from "react";
import { uploadImages } from "../../../services/uploads";
import { getErrorMessage } from "../../../services/error";
import { useToast } from "../Toast/ToastContext";
import ImageCropModal from "../ImageCropModal/ImageCropModal";
import { PlusIcon, XIcon } from "../icons";
import "./ImageUploader.css";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB, matches the server limit

type UploadItem = {
  id: string;
  previewUrl: string; // blob: URL for new files, or the Cloudinary URL for existing ones
  status: "uploading" | "done" | "error";
  url?: string; // Cloudinary URL once uploaded
};

type Queued = { id: string; file: File; src: string };

type ImageUploaderProps = {
  // Existing image URLs to start with (e.g. when editing a stadium).
  initialUrls?: string[];
  max?: number;
  // Fired with the current list of committed (uploaded) Cloudinary URLs.
  onChange: (urls: string[]) => void;
  // Fired when uploads start/finish so the parent can disable submit.
  onBusyChange?: (busy: boolean) => void;
};

function ImageUploader({
  initialUrls = [],
  max = 6,
  onChange,
  onBusyChange,
}: ImageUploaderProps) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // `items` drives the UI; `itemsRef` mirrors it so async upload callbacks always
  // read the latest list without stale closures, and we report up imperatively.
  const [items, setItems] = useState<UploadItem[]>(() =>
    initialUrls.map((url) => ({
      id: crypto.randomUUID(),
      previewUrl: url,
      status: "done" as const,
      url,
    })),
  );
  const itemsRef = useRef<UploadItem[]>(items);
  const mountedRef = useRef(true);
  // Set true on (re)mount and false on unmount. Setting it in the setup is
  // important under StrictMode, which mounts → unmounts → remounts.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Files waiting to be cropped, processed one at a time via the crop modal.
  const [cropQueue, setCropQueue] = useState<Queued[]>([]);
  const cropQueueRef = useRef<Queued[]>(cropQueue);

  // On unmount, revoke any blob: URLs we created — both committed previews and
  // any crop-queue sources that never made it through the modal.
  useEffect(() => {
    return () => {
      itemsRef.current.forEach((it) => {
        if (it.previewUrl.startsWith("blob:")) URL.revokeObjectURL(it.previewUrl);
      });
      cropQueueRef.current.forEach((q) => URL.revokeObjectURL(q.src));
    };
  }, []);

  function apply(next: UploadItem[]) {
    itemsRef.current = next;
    if (!mountedRef.current) return; // uploader unmounted mid-upload; don't touch parent state
    setItems(next);
    onChange(
      next.filter((i) => i.status === "done" && i.url).map((i) => i.url as string),
    );
    onBusyChange?.(next.some((i) => i.status === "uploading"));
  }

  function setQueue(next: Queued[]) {
    cropQueueRef.current = next;
    setCropQueue(next);
  }

  // Validate selected files and queue them for cropping.
  function enqueueFiles(fileList: FileList) {
    const valid: File[] = [];
    for (const file of Array.from(fileList)) {
      if (!file.type.startsWith("image/")) {
        toast.error(`"${file.name}" isn't an image.`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        toast.error(`"${file.name}" is larger than 5MB.`);
        continue;
      }
      valid.push(file);
    }

    const remaining =
      max - itemsRef.current.length - cropQueueRef.current.length;
    let accepted = valid;
    if (valid.length > remaining) {
      toast.error(`You can upload up to ${max} images.`);
      accepted = valid.slice(0, Math.max(remaining, 0));
    }
    if (accepted.length > 0) {
      setQueue([
        ...cropQueueRef.current,
        // Create the preview URL here (in an event handler) — not in the modal's
        // effect — so StrictMode can't revoke a URL the cropper still needs.
        ...accepted.map((file) => ({
          id: crypto.randomUUID(),
          file,
          src: URL.createObjectURL(file),
        })),
      ]);
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) enqueueFiles(e.target.files);
    e.target.value = ""; // allow re-selecting the same file
  }

  // The crop modal returns the cropped image; upload it and move to the next.
  async function handleCropped(blob: Blob) {
    const current = cropQueueRef.current[0];
    if (current) URL.revokeObjectURL(current.src); // crop done; source no longer needed
    setQueue(cropQueueRef.current.slice(1)); // dequeue → next file's modal (or close)

    const baseName = current?.file.name.replace(/\.[^.]+$/, "") ?? "photo";
    const file = new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
    const id = crypto.randomUUID();
    const previewUrl = URL.createObjectURL(blob);
    apply([...itemsRef.current, { id, previewUrl, status: "uploading" }]);
    try {
      const [url] = await uploadImages([file]);
      apply(
        itemsRef.current.map((it) =>
          it.id === id ? { ...it, status: "done" as const, url } : it,
        ),
      );
    } catch (err) {
      apply(
        itemsRef.current.map((it) =>
          it.id === id ? { ...it, status: "error" as const } : it,
        ),
      );
      toast.error(getErrorMessage(err, "Couldn't upload that image."));
    }
  }

  function skipCrop() {
    const current = cropQueueRef.current[0];
    if (current) URL.revokeObjectURL(current.src);
    setQueue(cropQueueRef.current.slice(1));
  }

  function removeImage(id: string) {
    const target = itemsRef.current.find((it) => it.id === id);
    if (target && target.previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(target.previewUrl);
    }
    apply(itemsRef.current.filter((it) => it.id !== id));
  }

  return (
    <div className="image-uploader">
      {items.map((img) => (
        <div className="image-tile" key={img.id}>
          <img src={img.previewUrl} alt="" className="image-tile-img" />
          {img.status === "uploading" && (
            <div className="image-tile-overlay">
              <span className="image-tile-spinner" aria-hidden="true" />
            </div>
          )}
          {img.status === "error" && (
            <div className="image-tile-overlay image-tile-overlay-error">
              Failed
            </div>
          )}
          <button
            type="button"
            className="image-remove"
            onClick={() => removeImage(img.id)}
            aria-label="Remove image"
          >
            <XIcon size={14} />
          </button>
        </div>
      ))}

      {items.length + cropQueue.length < max && (
        <button
          type="button"
          className="image-add"
          onClick={() => fileInputRef.current?.click()}
        >
          <PlusIcon size={22} />
          <span>Add photos</span>
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={onInputChange}
      />

      {cropQueue.length > 0 && (
        <ImageCropModal
          key={cropQueue[0].id}
          src={cropQueue[0].src}
          file={cropQueue[0].file}
          onConfirm={handleCropped}
          onCancel={skipCrop}
        />
      )}
    </div>
  );
}

export default ImageUploader;
