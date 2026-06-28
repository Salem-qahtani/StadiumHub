import { useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import Modal from "../Modal/Modal";
import Button from "../Button/Button";
import { useToast } from "../Toast/ToastContext";
import { getCroppedBlob } from "../../../utils/cropImage";
import "./ImageCropModal.css";

type ImageCropModalProps = {
  // Object URL for the image. Owned by the parent (ImageUploader) so its
  // lifecycle isn't tied to this component's effects — React 19 StrictMode
  // would otherwise revoke it on the simulated unmount and break the cropper.
  src: string;
  // Original file, used only as a fallback if cropping fails.
  file: File;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
};

// Lets the user drag + zoom a photo inside a fixed 16:9 frame (matching the
// gallery/card placeholders) and returns the cropped result as a Blob.
function ImageCropModal({ src, file, onConfirm, onCancel }: ImageCropModalProps) {
  const toast = useToast();
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaPixels, setAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  async function apply() {
    if (!areaPixels) return;
    setProcessing(true);
    try {
      const blob = await getCroppedBlob(src, areaPixels);
      onConfirm(blob);
    } catch {
      // fall back to the uncropped file rather than blocking the user,
      // but let them know it won't be cropped to fit
      toast.error("Couldn't crop — uploading the original photo.");
      onConfirm(file);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <Modal
      open
      title="Adjust photo"
      onClose={onCancel}
      footer={
        <>
          <Button variant="ghost" onClick={onCancel} disabled={processing}>
            Skip
          </Button>
          <Button onClick={apply} loading={processing} disabled={!areaPixels}>
            Use photo
          </Button>
        </>
      }
    >
      <div className="cropper-area">
        <Cropper
          image={src}
          crop={crop}
          zoom={zoom}
          aspect={16 / 9}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={(_area, areaPixelsValue) =>
            setAreaPixels(areaPixelsValue)
          }
        />
      </div>
      <label className="cropper-zoom">
        <span>Zoom</span>
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          aria-label="Zoom"
        />
      </label>
      <p className="cropper-hint">Drag to reposition · slide to zoom</p>
    </Modal>
  );
}

export default ImageCropModal;
