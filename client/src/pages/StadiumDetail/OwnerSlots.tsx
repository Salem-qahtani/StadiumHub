import { useEffect, useState } from "react";
import type { Slot } from "../../types";
import { getOwnerSlots, createSlot, deleteSlot } from "../../services/slots";
import { getErrorMessage } from "../../services/error";
import { useToast } from "../../components/ui/Toast/ToastContext";
import Button from "../../components/ui/Button/Button";
import Spinner from "../../components/ui/Spinner/Spinner";
import EmptyState from "../../components/ui/EmptyState/EmptyState";
import Modal from "../../components/ui/Modal/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog/ConfirmDialog";
import Badge from "../../components/ui/Badge/Badge";
import { TextField } from "../../components/ui/Field/Field";
import { PlusIcon, TrashIcon, CalendarIcon } from "../../components/ui/icons";
import { formatSlotDate, formatTimeRange } from "../../utils/format";
import { sortSlots } from "../../utils/slots";

type SlotForm = { date: string; startTime: string; endTime: string };
type SlotFormErrors = Partial<SlotForm>;

function OwnerSlots({ stadiumId }: { stadiumId: number }) {
  const toast = useToast();

  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<SlotForm>({
    date: "",
    startTime: "",
    endTime: "",
  });
  const [formErrors, setFormErrors] = useState<SlotFormErrors>({});
  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState<Slot | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getOwnerSlots(stadiumId);
        if (active) setSlots(sortSlots(data));
      } catch (err) {
        if (active) setLoadError(getErrorMessage(err, "Couldn't load slots."));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [stadiumId, reloadKey]);

  function retry() {
    setLoading(true);
    setLoadError(null);
    setReloadKey((k) => k + 1);
  }

  function openAdd() {
    setForm({ date: "", startTime: "", endTime: "" });
    setFormErrors({});
    setAdding(true);
  }

  function validate(): boolean {
    const next: SlotFormErrors = {};
    if (!form.date) next.date = "Pick a date.";
    if (!form.startTime) next.startTime = "Start time is required.";
    if (!form.endTime) next.endTime = "End time is required.";
    if (form.startTime && form.endTime && form.startTime >= form.endTime) {
      next.endTime = "End must be after start.";
    }
    setFormErrors(next);
    return Object.keys(next).length === 0;
  }

  async function saveAdd() {
    if (!validate()) return;
    setSaving(true);
    try {
      const slot = await createSlot(stadiumId, form);
      setSlots((prev) => sortSlots([...prev, slot]));
      toast.success("Slot added.");
      setAdding(false);
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't add the slot."));
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await deleteSlot(stadiumId, deleting.id);
      setSlots((prev) => prev.filter((s) => s.id !== deleting.id));
      toast.success("Slot deleted.");
      setDeleting(null);
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't delete the slot."));
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <section className="slots-section">
      <div className="slots-header">
        <h2 className="slots-title">Slots</h2>
        <Button size="sm" iconLeft={<PlusIcon size={16} />} onClick={openAdd}>
          Add slot
        </Button>
      </div>

      {loading && <Spinner label="Loading slots…" />}

      {!loading && loadError && (
        <EmptyState
          icon={<CalendarIcon size={26} />}
          title="Couldn't load slots"
          message={loadError}
          action={
            <Button variant="secondary" onClick={retry}>
              Try again
            </Button>
          }
        />
      )}

      {!loading && !loadError && slots.length === 0 && (
        <EmptyState
          icon={<CalendarIcon size={26} />}
          title="No slots yet"
          message="Add time slots so organizers can book this stadium."
          action={
            <Button iconLeft={<PlusIcon size={16} />} onClick={openAdd}>
              Add slot
            </Button>
          }
        />
      )}

      {!loading && !loadError && slots.length > 0 && (
        <ul className="slot-list">
          {slots.map((slot) => (
            <li key={slot.id} className="slot-row">
              <div className="slot-when">
                <span className="slot-date">{formatSlotDate(slot.date)}</span>
                <span className="slot-time">
                  {formatTimeRange(slot.startTime, slot.endTime)}
                </span>
              </div>
              <Badge tone={slot.available ? "success" : "neutral"}>
                {slot.available ? "Available" : "Booked"}
              </Badge>
              <div className="slot-actions">
                <button
                  type="button"
                  className="icon-btn icon-btn-danger"
                  onClick={() => setDeleting(slot)}
                  aria-label="Delete slot"
                >
                  <TrashIcon size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={adding}
        title="Add slot"
        onClose={() => !saving && setAdding(false)}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setAdding(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={saveAdd} loading={saving}>
              Add slot
            </Button>
          </>
        }
      >
        <form
          className="slot-form"
          onSubmit={(e) => {
            e.preventDefault();
            saveAdd();
          }}
        >
          <TextField
            label="Date"
            type="date"
            required
            value={form.date}
            error={formErrors.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
          <div className="slot-form-times">
            <TextField
              label="Start time"
              type="time"
              required
              value={form.startTime}
              error={formErrors.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
            />
            <TextField
              label="End time"
              type="time"
              required
              value={form.endTime}
              error={formErrors.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
            />
          </div>
          <button type="submit" hidden />
        </form>
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title="Delete slot?"
        message={
          deleting
            ? `The ${formatSlotDate(deleting.date)} ${formatTimeRange(deleting.startTime, deleting.endTime)} slot will be removed. This can't be undone.`
            : ""
        }
        confirmLabel="Delete"
        loading={deleteLoading}
        onConfirm={confirmDelete}
        onClose={() => !deleteLoading && setDeleting(null)}
      />
    </section>
  );
}

export default OwnerSlots;
