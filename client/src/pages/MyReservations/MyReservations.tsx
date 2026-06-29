import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Reservation, ReservationStatus } from "../../types";
import {
  getMyReservations,
  cancelReservation,
} from "../../services/reservations";
import { startConversation } from "../../services/conversations";
import { getErrorMessage } from "../../services/error";
import { useToast } from "../../components/ui/Toast/ToastContext";
import PageHeader from "../../components/ui/PageHeader/PageHeader";
import Button from "../../components/ui/Button/Button";
import Spinner from "../../components/ui/Spinner/Spinner";
import EmptyState from "../../components/ui/EmptyState/EmptyState";
import Badge from "../../components/ui/Badge/Badge";
import Select from "../../components/ui/Select/Select";
import type { SelectOption } from "../../components/ui/Select/Select";
import ConfirmDialog from "../../components/ui/ConfirmDialog/ConfirmDialog";
import {
  TicketIcon,
  ClockIcon,
  MapPinIcon,
  StadiumIcon,
  MessageIcon,
} from "../../components/ui/icons";
import { formatSlotDate, formatTimeRange } from "../../utils/format";
import "./MyReservations.css";

type Tab = "upcoming" | "past";
type StatusFilter = "all" | ReservationStatus;

const statusOptions: SelectOption<StatusFilter>[] = [
  { value: "all", label: "All" },
  { value: "confirmed", label: "Confirmed" },
  { value: "cancelled", label: "Cancelled" },
];

// Local midnight today, used to split reservations into upcoming vs. past.
function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

// The slot's calendar day at local midnight. Slot dates arrive as UTC midnight
// (date-only values), so read the UTC calendar parts and rebuild a local-midnight
// timestamp — otherwise the day shifts by one in negative-UTC timezones and
// today's slots get misclassified as past.
function slotDayStart(reservation: Reservation): number {
  if (!reservation.slot) return 0;
  const d = new Date(reservation.slot.date);
  return new Date(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate(),
  ).getTime();
}

function MyReservations() {
  const navigate = useNavigate();
  const toast = useToast();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [tab, setTab] = useState<Tab>("upcoming");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [stadiumId, setStadiumId] = useState<number | "all">("all");

  // Cancel confirmation
  const [pendingCancel, setPendingCancel] = useState<Reservation | null>(null);
  const [cancelling, setCancelling] = useState(false);
  // Reservation whose "Message owner" request is in flight.
  const [messagingId, setMessagingId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getMyReservations();
        if (active) setReservations(data);
      } catch (err) {
        if (active)
          setLoadError(getErrorMessage(err, "Couldn't load your reservations."));
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

  // Open (or reuse) the conversation with this booking's stadium owner.
  async function messageOwner(reservation: Reservation) {
    if (messagingId !== null) return; // a message request is already in flight
    const ownerId = reservation.slot?.stadium?.ownerId;
    if (!ownerId) return;
    setMessagingId(reservation.id);
    try {
      const conv = await startConversation({ ownerId });
      navigate("/dashboard/messages", {
        state: { conversationId: conv.id, peerName: conv.owner?.username },
      });
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't open the conversation."));
    } finally {
      setMessagingId(null);
    }
  }

  async function confirmCancel() {
    if (!pendingCancel) return;
    const target = pendingCancel;
    setCancelling(true);
    try {
      const updated = await cancelReservation(target.id);
      // reflect the cancellation locally (status flips, slot is freed server-side)
      setReservations((prev) =>
        prev.map((r) =>
          r.id === target.id ? { ...r, status: updated.status } : r,
        ),
      );
      toast.success("Reservation cancelled.");
      setPendingCancel(null);
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't cancel this reservation."));
      setPendingCancel(null);
    } finally {
      setCancelling(false);
    }
  }

  // Distinct stadiums across all reservations, for the stadium filter dropdown.
  const stadiums = useMemo(() => {
    const map = new Map<number, string>();
    for (const r of reservations) {
      const s = r.slot?.stadium;
      if (s) map.set(s.id, s.name);
    }
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [reservations]);

  const stadiumOptions = useMemo<SelectOption<number | "all">[]>(
    () => [
      { value: "all", label: "All stadiums" },
      ...stadiums.map((s) => ({ value: s.id, label: s.name })),
    ],
    [stadiums],
  );

  // Counts for the Upcoming / Past tab labels (the other filters don't affect
  // these so the tabs always reflect the full split).
  const tabCounts = useMemo(() => {
    const today = startOfToday();
    let upcoming = 0;
    let past = 0;
    for (const r of reservations) {
      if (slotDayStart(r) >= today) upcoming++;
      else past++;
    }
    return { upcoming, past };
  }, [reservations]);

  const visible = useMemo(() => {
    const today = startOfToday();
    const filtered = reservations.filter((r) => {
      const isUpcoming = slotDayStart(r) >= today;
      if (tab === "upcoming" ? !isUpcoming : isUpcoming) return false;
      if (status !== "all" && r.status !== status) return false;
      if (stadiumId !== "all" && r.slot?.stadium?.id !== stadiumId) return false;
      return true;
    });
    // Upcoming: soonest first. Past: most recent first.
    filtered.sort((a, b) =>
      tab === "upcoming"
        ? slotDayStart(a) - slotDayStart(b)
        : slotDayStart(b) - slotDayStart(a),
    );
    return filtered;
  }, [reservations, tab, status, stadiumId]);

  const hasReservations = reservations.length > 0;

  return (
    <div className="my-reservations">
      <PageHeader
        title="My Reservations"
        subtitle="Every slot you've booked across stadiums."
      />

      {loading && <Spinner label="Loading your reservations…" />}

      {!loading && loadError && (
        <EmptyState
          icon={<TicketIcon size={28} />}
          title="Something went wrong"
          message={loadError}
          action={
            <Button variant="secondary" onClick={retry}>
              Try again
            </Button>
          }
        />
      )}

      {!loading && !loadError && !hasReservations && (
        <EmptyState
          icon={<TicketIcon size={28} />}
          title="No reservations yet"
          message="Browse stadiums and reserve a time slot — your bookings will show up here."
          action={
            <Button onClick={() => navigate("/dashboard")}>
              Browse stadiums
            </Button>
          }
        />
      )}

      {!loading && !loadError && hasReservations && (
        <>
          <div className="resv-toolbar">
            <div className="resv-tabs" role="tablist" aria-label="Reservation period">
              <button
                type="button"
                role="tab"
                id="resv-tab-upcoming"
                aria-selected={tab === "upcoming"}
                aria-controls="resv-tabpanel"
                className={`resv-tab ${tab === "upcoming" ? "is-active" : ""}`}
                onClick={() => setTab("upcoming")}
              >
                Upcoming
                <span className="resv-tab-count">{tabCounts.upcoming}</span>
              </button>
              <button
                type="button"
                role="tab"
                id="resv-tab-past"
                aria-selected={tab === "past"}
                aria-controls="resv-tabpanel"
                className={`resv-tab ${tab === "past" ? "is-active" : ""}`}
                onClick={() => setTab("past")}
              >
                Past
                <span className="resv-tab-count">{tabCounts.past}</span>
              </button>
            </div>

            <div className="resv-filters">
              <Select
                label="Status"
                value={status}
                onChange={setStatus}
                options={statusOptions}
              />
              <Select
                label="Stadium"
                value={stadiumId}
                onChange={setStadiumId}
                options={stadiumOptions}
              />
            </div>
          </div>

          <div
            role="tabpanel"
            id="resv-tabpanel"
            aria-labelledby={
              tab === "upcoming" ? "resv-tab-upcoming" : "resv-tab-past"
            }
          >
            <p className="resv-count">
              {visible.length}{" "}
              {visible.length === 1 ? "reservation" : "reservations"}
            </p>

            {visible.length === 0 ? (
              <EmptyState
                icon={<TicketIcon size={28} />}
                title="Nothing here"
                message="No reservations match these filters. Try a different tab or filter."
              />
            ) : (
              <ul className="resv-list">
                {visible.map((reservation) => {
                  const slot = reservation.slot;
                  const stadium = slot?.stadium;
                  const isCancelled = reservation.status === "cancelled";
                  const isUpcoming = slotDayStart(reservation) >= startOfToday();
                  const canCancel = !isCancelled && isUpcoming;
                  return (
                    <li key={reservation.id} className="resv-card">
                      <div className="resv-info">
                        <span className="resv-datetime">
                          {slot ? formatSlotDate(slot.date) : "—"}
                          {slot && (
                            <span className="resv-time">
                              <ClockIcon size={14} />
                              {formatTimeRange(slot.startTime, slot.endTime)}
                            </span>
                          )}
                        </span>
                        <div className="resv-sub">
                          <span className="resv-stadium-tag">
                            <StadiumIcon size={14} />
                            {stadium?.name ?? "Stadium"}
                          </span>
                          {stadium?.location && (
                            <span className="resv-loc">
                              <MapPinIcon size={14} />
                              {stadium.location}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Order is fixed L→R: [Cancel?] · Status · Message, so the
                          Status badge and Message button never shift when Cancel
                          is absent — only the optional Cancel appears on the left. */}
                      {canCancel && (
                        <Button
                          size="sm"
                          variant="ghost"
                          aria-label={`Cancel reservation at ${
                            stadium?.name ?? "this stadium"
                          }${slot ? ` on ${formatSlotDate(slot.date)}` : ""}`}
                          onClick={() => setPendingCancel(reservation)}
                        >
                          Cancel
                        </Button>
                      )}

                      <Badge tone={isCancelled ? "neutral" : "success"}>
                        {isCancelled ? "Cancelled" : "Confirmed"}
                      </Badge>

                      <Button
                        size="sm"
                        variant="secondary"
                        iconLeft={<MessageIcon size={16} />}
                        loading={messagingId === reservation.id}
                        aria-label={`Message the owner of ${stadium?.name ?? "this stadium"}`}
                        onClick={() => messageOwner(reservation)}
                      >
                        Message
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}

      <ConfirmDialog
        open={pendingCancel !== null}
        title="Cancel reservation?"
        message={
          pendingCancel?.slot
            ? `Cancel your booking at ${
                pendingCancel.slot.stadium?.name ?? "this stadium"
              } on ${formatSlotDate(
                pendingCancel.slot.date,
                "en-US",
              )}, ${formatTimeRange(
                pendingCancel.slot.startTime,
                pendingCancel.slot.endTime,
                "en-US",
              )}?\n\nThe slot will be released for others to book.`
            : ""
        }
        confirmLabel="Cancel reservation"
        cancelLabel="Keep it"
        tone="danger"
        centered
        loading={cancelling}
        onConfirm={confirmCancel}
        onClose={() => !cancelling && setPendingCancel(null)}
      />
    </div>
  );
}

export default MyReservations;
