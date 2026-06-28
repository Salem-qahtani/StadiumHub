import { useEffect, useState } from "react";
import type { Slot } from "../../types";
import { getSlots } from "../../services/slots";
import { createReservation } from "../../services/reservations";
import { getErrorMessage } from "../../services/error";
import { useToast } from "../../components/ui/Toast/ToastContext";
import Button from "../../components/ui/Button/Button";
import Spinner from "../../components/ui/Spinner/Spinner";
import EmptyState from "../../components/ui/EmptyState/EmptyState";
import Badge from "../../components/ui/Badge/Badge";
import ConfirmDialog from "../../components/ui/ConfirmDialog/ConfirmDialog";
import { CalendarIcon } from "../../components/ui/icons";
import { formatSlotDate, formatTimeRange } from "../../utils/format";
import { sortSlots } from "../../utils/slots";
import { AxiosError } from "axios";

type OrganizerSlotsProps = {
  stadiumId: number;
  stadiumName: string;
  stadiumLocation: string;
};

function OrganizerSlots({
  stadiumId,
  stadiumName,
  stadiumLocation,
}: OrganizerSlotsProps) {
  const toast = useToast();

  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  // The slot awaiting reservation confirmation, plus whether the request is
  // in flight (one reservation happens at a time, through the dialog).
  const [pendingSlot, setPendingSlot] = useState<Slot | null>(null);
  const [reserving, setReserving] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getSlots(stadiumId);
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

  async function confirmReserve() {
    if (!pendingSlot) return;
    const slot = pendingSlot;
    setReserving(true);
    try {
      await createReservation(slot.id);
      // mark it booked locally so the row reflects the new state immediately
      setSlots((prev) =>
        prev.map((s) => (s.id === slot.id ? { ...s, available: false } : s)),
      );
      toast.success("Slot reserved.");
      setPendingSlot(null);
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't reserve this slot."));
      // 409 = someone grabbed it first → our list is stale, refresh it.
      // Other errors (network/500) leave the list intact.
      if (err instanceof AxiosError && err.response?.status === 409) retry();
      setPendingSlot(null);
    } finally {
      setReserving(false);
    }
  }

  return (
    <section className="slots-section">
      <div className="slots-header">
        <h2 className="slots-title">Available slots</h2>
        <span className="slots-subnote">Next 7 days</span>
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
          title="No slots available"
          message="This stadium has no open time slots in the next 7 days. Check back later."
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
              <div className="slot-actions">
                {slot.available ? (
                  <Button size="sm" onClick={() => setPendingSlot(slot)}>
                    Reserve
                  </Button>
                ) : (
                  <Badge tone="neutral">Booked</Badge>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={pendingSlot !== null}
        title="Confirm reservation"
        message={
          pendingSlot
            ? `Reserve ${stadiumName} (${stadiumLocation}) on ${formatSlotDate(
                pendingSlot.date,
                "en-US",
              )}, ${formatTimeRange(
                pendingSlot.startTime,
                pendingSlot.endTime,
                "en-US",
              )}?\n\nPlease confirm you want to book this slot.`
            : ""
        }
        confirmLabel="Reserve"
        tone="primary"
        centered
        loading={reserving}
        onConfirm={confirmReserve}
        onClose={() => !reserving && setPendingSlot(null)}
      />
    </section>
  );
}

export default OrganizerSlots;
