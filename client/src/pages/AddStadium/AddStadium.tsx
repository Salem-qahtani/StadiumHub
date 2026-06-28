import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createStadium } from "../../services/stadiums";
import { getErrorMessage } from "../../services/error";
import { useToast } from "../../components/ui/Toast/ToastContext";
import PageHeader from "../../components/ui/PageHeader/PageHeader";
import Button from "../../components/ui/Button/Button";
import { TextField, TextArea, FieldGroup } from "../../components/ui/Field/Field";
import ImageUploader from "../../components/ui/ImageUploader/ImageUploader";
import { ChevronLeftIcon } from "../../components/ui/icons";
import "./AddStadium.css";

type FormState = { name: string; location: string; description: string };
type FormErrors = Partial<FormState>;

function AddStadium() {
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState<FormState>({
    name: "",
    location: "",
    description: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [imagesBusy, setImagesBusy] = useState(false);

  function validate(): boolean {
    const next: FormErrors = {};
    if (!form.name.trim()) next.name = "Name is required.";
    if (!form.location.trim()) next.location = "Location is required.";
    if (!form.description.trim()) next.description = "Description is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const stadium = await createStadium({
        name: form.name.trim(),
        location: form.location.trim(),
        description: form.description.trim(),
        images,
      });
      toast.success(`"${stadium.name}" created.`);
      navigate(`/landing/stadiums/${stadium.id}`);
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't create the stadium."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="add-stadium">
      <button
        className="back-link"
        onClick={() => navigate("/landing")}
        type="button"
      >
        <ChevronLeftIcon size={18} />
        My Stadiums
      </button>

      <PageHeader
        title="Add stadium"
        subtitle="Publish a new stadium. You can add bookable time slots once it's created."
      />

      <form className="add-stadium-card" onSubmit={handleSubmit} noValidate>
        <TextField
          label="Name"
          required
          value={form.name}
          error={errors.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Riverside Arena"
          autoFocus
        />
        <TextField
          label="Location"
          required
          value={form.location}
          error={errors.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          placeholder="e.g. Riyadh, Al Olaya"
        />
        <TextArea
          label="Description"
          required
          value={form.description}
          error={errors.description}
          hint="Mention the surface, size, and facilities organizers care about."
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Full-size natural grass pitch with floodlights, changing rooms, and parking."
        />

        <FieldGroup label="Photos" hint="Optional. Up to 6 images, max 5MB each.">
          <ImageUploader onChange={setImages} onBusyChange={setImagesBusy} />
        </FieldGroup>

        <div className="add-stadium-actions">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate("/landing")}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="submit" loading={saving} disabled={imagesBusy}>
            {imagesBusy ? "Uploading photos…" : "Create stadium"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default AddStadium;
