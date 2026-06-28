import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Reservation, ReservationStatus } from "../../types";
import { getOwnerReservations } from "../../services/reservations";
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
import {
  TicketIcon,
  ClockIcon,
  UserIcon,
  MessageIcon,
  StadiumIcon,
} from "../../components/ui/icons";
import { formatSlotDate, formatTimeRange } from "../../utils/format";
import "./IncomingReservations.css";

type Tab = "upcoming" | "past";
type StatusFilter = "all" | ReservationStatus;

const statusOptions: SelectOption<StatusFilter>[] = [
  { value: "all", label: "All" },
  { value: "confirmed", label: "Confirmed" },
  { value: "cancelled", label: "Cancelled" },
];

// Midnight today, used to split reservations into upcoming vs. past by slot date.
function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function slotTime(reservation: Reservation): number {
  return reservation.slot ? new Date(reservation.slot.date).getTime() : 0;
}

function IncomingReservations() {
  const navigate = useNavigate();
  const toast = useToast();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [messagingId, setMessagingId] = useState<number | null>(null);

  const [tab, setTab] = useState<Tab>("upcoming");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [stadiumId, setStadiumId] = useState<number | "all">("all");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getOwnerReservations();
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

  async function messageOrganizer(reservation: Reservation) {
    setMessagingId(reservation.id);
    try {
      await startConversation({ organizerId: reservation.organizerId });
      navigate("/dashboard/messages");
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't open the conversation."));
    } finally {
      setMessagingId(null);
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

  // Counts for the Upcoming / Past tab labels (status + stadium filters don't
  // affect these so the tabs always reflect the full split).
  const tabCounts = useMemo(() => {
    const today = startOfToday();
    let upcoming = 0;
    let past = 0;
    for (const r of reservations) {
      if (slotTime(r) >= today) upcoming++;
      else past++;
    }
    return { upcoming, past };
  }, [reservations]);

  const visible = useMemo(() => {
    const today = startOfToday();
    const filtered = reservations.filter((r) => {
      const isUpcoming = slotTime(r) >= today;
      if (tab === "upcoming" ? !isUpcoming : isUpcoming) return false;
      if (status !== "all" && r.status !== status) return false;
      if (stadiumId !== "all" && r.slot?.stadium?.id !== stadiumId) return false;
      return true;
    });
    // Upcoming: soonest first. Past: most recent first.
    filtered.sort((a, b) =>
      tab === "upcoming"
        ? slotTime(a) - slotTime(b)
        : slotTime(b) - slotTime(a),
    );
    return filtered;
  }, [reservations, tab, status, stadiumId]);

  const hasReservations = reservations.length > 0;

  return (
    <div className="incoming-reservations">
      <PageHeader
        title="Reservations"
        subtitle="Every booking organizers have made across your stadiums."
      />

      {loading && <Spinner label="Loading reservations…" />}

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
          message="When organizers book your stadium slots, their reservations will show up here."
        />
      )}

      {!loading && !loadError && hasReservations && (
        <>
          <div className="resv-toolbar">
            <div className="resv-tabs" role="tablist" aria-label="Reservation period">
              <button
                type="button"
                role="tab"
                aria-selected={tab === "upcoming"}
                className={`resv-tab ${tab === "upcoming" ? "is-active" : ""}`}
                onClick={() => setTab("upcoming")}
              >
                Upcoming
                <span className="resv-tab-count">{tabCounts.upcoming}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === "past"}
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

          <p className="resv-count">
            {visible.length} {visible.length === 1 ? "reservation" : "reservations"}
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
                        <span className="resv-org">
                          <UserIcon size={14} />
                          {reservation.organizer?.username ?? "Organizer"}
                        </span>
                      </div>
                    </div>

                    <Badge tone={isCancelled ? "neutral" : "success"}>
                      {isCancelled ? "Cancelled" : "Confirmed"}
                    </Badge>

                    <Button
                      size="sm"
                      variant="secondary"
                      iconLeft={<MessageIcon size={16} />}
                      loading={messagingId === reservation.id}
                      onClick={() => messageOrganizer(reservation)}
                    >
                      Message
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

export default IncomingReservations;
