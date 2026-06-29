import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Stadium } from "../../types";
import { getStadiums } from "../../services/stadiums";
import { startConversation } from "../../services/conversations";
import { getErrorMessage } from "../../services/error";
import { useToast } from "../../components/ui/Toast/ToastContext";
import PageHeader from "../../components/ui/PageHeader/PageHeader";
import Button from "../../components/ui/Button/Button";
import Spinner from "../../components/ui/Spinner/Spinner";
import EmptyState from "../../components/ui/EmptyState/EmptyState";
import {
  StadiumIcon,
  MapPinIcon,
  SearchIcon,
  XIcon,
  UserIcon,
  MessageIcon,
  ChevronRightIcon,
} from "../../components/ui/icons";
import "./BrowseStadiums.css";

function BrowseStadiums() {
  const navigate = useNavigate();
  const toast = useToast();

  const [query, setQuery] = useState("");
  const [search, setSearch] = useState(""); // debounced query sent to the API
  const [stadiums, setStadiums] = useState<Stadium[]>([]);
  const [loading, setLoading] = useState(true); // first load only
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [messagingId, setMessagingId] = useState<number | null>(null);

  // Debounce the search box so we don't hit the API on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setSearch(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  // Fetch whenever the debounced search changes or the user retries.
  // setState only runs after the await, so no cascading-render lint error.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getStadiums(search || undefined);
        if (!active) return;
        setStadiums(data);
        setLoadError(null);
      } catch (err) {
        if (active) setLoadError(getErrorMessage(err, "Couldn't load stadiums."));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [search, reloadKey]);

  function retry() {
    setLoading(true);
    setLoadError(null);
    setReloadKey((k) => k + 1);
  }

  // Open (or reuse) the conversation with this stadium's owner, then go to chat.
  async function messageOwner(stadium: Stadium) {
    if (messagingId !== null) return; // a message request is already in flight
    setMessagingId(stadium.id);
    try {
      const conv = await startConversation({ ownerId: stadium.ownerId });
      navigate("/dashboard/messages", {
        state: { conversationId: conv.id, peerName: conv.owner?.username },
      });
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't open the conversation."));
    } finally {
      setMessagingId(null);
    }
  }

  // True while the user has typed something the API hasn't caught up to yet.
  const pending = query.trim() !== search;

  return (
    <div className="browse-stadiums">
      <PageHeader
        title="Browse Stadiums"
        subtitle="Find a stadium and reserve a time slot."
      />

      <div className="browse-search">
        <SearchIcon size={18} className="browse-search-icon" />
        <input
          type="search"
          className="browse-search-input"
          placeholder="Search by name or location…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search stadiums by name or location"
        />
        {pending && <span className="browse-search-spinner" aria-hidden="true" />}
        {query && !pending && (
          <button
            type="button"
            className="browse-search-clear"
            onClick={() => setQuery("")}
            aria-label="Clear search"
          >
            <XIcon size={16} />
          </button>
        )}
      </div>

      {loading && <Spinner label="Loading stadiums…" />}

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
          icon={search ? <SearchIcon size={28} /> : <StadiumIcon size={28} />}
          title={search ? "No matches found" : "No stadiums available yet"}
          message={
            search
              ? `No stadiums match "${search}". Try a different name or location.`
              : "Check back soon — owners haven't published any stadiums yet."
          }
          action={
            search ? (
              <Button variant="secondary" onClick={() => setQuery("")}>
                Clear search
              </Button>
            ) : undefined
          }
        />
      )}

      {!loading && !loadError && stadiums.length > 0 && (
        <div className="browse-grid">
          {stadiums.map((stadium) => (
            <article
              key={stadium.id}
              className="browse-card"
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
              <div className="browse-card-cover">
                {stadium.images.length > 0 ? (
                  <img
                    src={stadium.images[0]}
                    alt={stadium.name}
                    className="browse-card-cover-img"
                    loading="lazy"
                  />
                ) : (
                  <div className="browse-card-cover-empty">
                    <StadiumIcon size={30} />
                  </div>
                )}
                {stadium.images.length > 1 && (
                  <span className="browse-card-count">
                    {stadium.images.length} photos
                  </span>
                )}
              </div>
              <div className="browse-card-body">
                <h2 className="browse-card-name">{stadium.name}</h2>
                <p className="browse-card-location">
                  <MapPinIcon size={15} />
                  {stadium.location}
                </p>
                {stadium.owner && (
                  <p className="browse-card-owner">
                    <UserIcon size={14} />
                    Hosted by {stadium.owner.username}
                  </p>
                )}
              </div>
              <div className="browse-card-footer">
                <span className="browse-card-cta">
                  View slots &amp; reserve
                  <ChevronRightIcon size={16} />
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  iconLeft={<MessageIcon size={16} />}
                  loading={messagingId === stadium.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    messageOwner(stadium);
                  }}
                >
                  Message
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default BrowseStadiums;
