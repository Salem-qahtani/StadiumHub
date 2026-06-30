import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Stadium } from "../../types";
import {
  getOwnerStadiums,
  updateStadium,
  deleteStadium,
} from "../../services/stadiums";
import { getErrorMessage } from "../../services/error";
import { useToast } from "../../components/ui/Toast/ToastContext";
import PageHeader from "../../components/ui/PageHeader/PageHeader";
import Button from "../../components/ui/Button/Button";
import Spinner from "../../components/ui/Spinner/Spinner";
import EmptyState from "../../components/ui/EmptyState/EmptyState";
import Modal from "../../components/ui/Modal/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog/ConfirmDialog";
import { TextField, TextArea, FieldGroup } from "../../components/ui/Field/Field";
import ImageUploader from "../../components/ui/ImageUploader/ImageUploader";
import {
  StadiumIcon,
  MapPinIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ChevronRightIcon,
} from "../../components/ui/icons";
import "./MyStadiums.css";

type FormState = { name: string; location: string; description: string };
type FormErrors = Partial<FormState>;

function MyStadiums() {
  const navigate = useNavigate();
  const toast = useToast();

  const [stadiums, setStadiums] = useState<Stadium[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // edit modal
  const [editing, setEditing] = useState<Stadium | null>(null);
  const [form, setForm] = useState<FormState>({
    name: "",
    location: "",
    description: "",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editImagesBusy, setEditImagesBusy] = useState(false);
  const [saving, setSaving] = useState(false);

  // delete confirm
  const [deleting, setDeleting] = useState<Stadium | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch on mount and whenever the user retries (reloadKey bump).
  // setState only runs after the await, so we don't trigger cascading renders.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getOwnerStadiums();
        if (active) setStadiums(data);
      } catch (err) {
        if (active)
          setLoadError(getErrorMessage(err, "Couldn't load your stadiums."));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [reloadKey]);

  function retry() {
    setLoading(true);
    setLoadError(null);
    setReloadKey((k) => k + 1);
  }

  function openEdit(stadium: Stadium) {
    setEditing(stadium);
    setForm({
      name: stadium.name,
      location: stadium.location,
      description: stadium.description,
    });
    setEditImages(stadium.images);
    setEditImagesBusy(false);
    setFormErrors({});
  }

  function validate(): boolean {
    const errors: FormErrors = {};
    if (!form.name.trim()) errors.name = "Name is required.";
    if (!form.location.trim()) errors.location = "Location is required.";
    if (!form.description.trim())
      errors.description = "Description is required.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function saveEdit() {
    if (!editing || !validate()) return;
    setSaving(true);
    try {
      const updated = await updateStadium(editing.id, {
        name: form.name.trim(),
        location: form.location.trim(),
        description: form.description.trim(),
        images: editImages,
      });
      setStadiums((prev) =>
        prev.map((s) => (s.id === updated.id ? updated : s)),
      );
      toast.success("Stadium updated.");
      setEditing(null);
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't update the stadium."));
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await deleteStadium(deleting.id);
      setStadiums((prev) => prev.filter((s) => s.id !== deleting.id));
      toast.success("Stadium deleted.");
      setDeleting(null);
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't delete the stadium."));
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="my-stadiums">
      <PageHeader
        title="My Stadiums"
        subtitle="Publish and manage the stadiums you rent out."
        action={
          <Button
            iconLeft={<PlusIcon size={18} />}
            onClick={() => navigate("/dashboard/stadiums/new")}
          >
            Add stadium
          </Button>
        }
      />

      {loading && <Spinner label="Loading your stadiums…" />}

      {!loading && loadError && (
        <EmptyState
          icon={<StadiumIcon size={28} />}
          title="Something went wrong"
          message={loadError}
          action={
            <Button variant="secondary" onClick={retry}>
              Try again
            </Button>
          }
        />
      )}

      {!loading && !loadError && stadiums.length === 0 && (
        <EmptyState
          icon={<StadiumIcon size={28} />}
          title="No stadiums yet"
          message="Add your first stadium to start publishing time slots for organizers to book."
          action={
            <Button
              iconLeft={<PlusIcon size={18} />}
              onClick={() => navigate("/dashboard/stadiums/new")}
            >
              Add stadium
            </Button>
          }
        />
      )}

      {!loading && !loadError && stadiums.length > 0 && (
        <div className="stadium-grid">
          {stadiums.map((stadium) => (
            <article
              key={stadium.id}
              className="stadium-card"
              role="button"
              tabIndex={0}
              aria-label={`View ${stadium.name}`}
              onClick={() => navigate(`/dashboard/stadiums/${stadium.id}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  navigate(`/dashboard/stadiums/${stadium.id}`);
                }
              }}
            >
              <div className="stadium-card-cover">
                {stadium.images.length > 0 ? (
                  <img
                    src={stadium.images[0]}
                    alt={stadium.name}
                    className="stadium-card-cover-img"
                    loading="lazy"
                  />
                ) : (
                  <div className="stadium-card-cover-empty">
                    <StadiumIcon size={30} />
                  </div>
                )}
                {stadium.images.length > 1 && (
                  <span className="stadium-card-count">
                    {stadium.images.length} photos
                  </span>
                )}
              </div>
              <div className="stadium-card-body">
                <h2 className="stadium-card-name">{stadium.name}</h2>
                <p className="stadium-card-location">
                  <MapPinIcon size={15} />
                  {stadium.location}
                </p>
              </div>
              <div className="stadium-card-footer">
                <button
                  type="button"
                  className="stadium-card-manage"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/dashboard/stadiums/${stadium.id}`);
                  }}
                >
                  Manage slots
                  <ChevronRightIcon size={16} />
                </button>
                <div className="stadium-card-actions">
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEdit(stadium);
                    }}
                    aria-label={`Edit ${stadium.name}`}
                  >
                    <PencilIcon size={17} />
                  </button>
                  <button
                    type="button"
                    className="icon-btn icon-btn-danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleting(stadium);
                    }}
                    aria-label={`Delete ${stadium.name}`}
                  >
                    <TrashIcon size={17} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        open={editing !== null}
        title="Edit stadium"
        onClose={() => !saving && setEditing(null)}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setEditing(null)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={saveEdit}
              loading={saving}
              disabled={editImagesBusy}
            >
              {editImagesBusy ? "Uploading photos…" : "Save changes"}
            </Button>
          </>
        }
      >
        <form
          className="stadium-form"
          onSubmit={(e) => {
            e.preventDefault();
            saveEdit();
          }}
        >
          <TextField
            label="Name"
            required
            maxLength={100}
            value={form.name}
            error={formErrors.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Riverside Arena"
          />
          <TextField
            label="Location"
            required
            maxLength={120}
            value={form.location}
            error={formErrors.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="e.g. Riyadh, Al Olaya"
          />
          <TextArea
            label="Description"
            required
            maxLength={2000}
            value={form.description}
            error={formErrors.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Surface, size, facilities…"
          />
          <FieldGroup label="Photos" hint="Up to 6 images, max 5MB each.">
            <ImageUploader
              key={editing?.id}
              initialUrls={editing?.images ?? []}
              onChange={setEditImages}
              onBusyChange={setEditImagesBusy}
            />
          </FieldGroup>
          {/* allow Enter-to-submit */}
          <button type="submit" hidden />
        </form>
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title="Delete stadium?"
        message={
          deleting
            ? `"${deleting.name}" and all of its slots and reservations will be permanently removed. This can't be undone.`
            : ""
        }
        confirmLabel="Delete"
        loading={deleteLoading}
        onConfirm={confirmDelete}
        onClose={() => !deleteLoading && setDeleting(null)}
      />
    </div>
  );
}

export default MyStadiums;
