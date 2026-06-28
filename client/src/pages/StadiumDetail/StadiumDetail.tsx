import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Stadium } from "../../types";
import { getStadium } from "../../services/stadiums";
import { getErrorMessage } from "../../services/error";
import { useAuth } from "../../contexts/AuthContext";
import Spinner from "../../components/ui/Spinner/Spinner";
import EmptyState from "../../components/ui/EmptyState/EmptyState";
import Button from "../../components/ui/Button/Button";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MapPinIcon,
  StadiumIcon,
} from "../../components/ui/icons";
import OwnerSlots from "./OwnerSlots";
import OrganizerSlots from "./OrganizerSlots";
import "./StadiumDetail.css";

function StadiumDetail() {
  const { id } = useParams();
  const stadiumId = Number(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const isOwner = user?.role === "owner";

  const invalid = Number.isNaN(stadiumId);
  const [stadium, setStadium] = useState<Stadium | null>(null);
  const [loading, setLoading] = useState(!invalid);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    if (invalid) return; // nothing to fetch; handled in render
    let active = true;
    (async () => {
      try {
        const data = await getStadium(stadiumId);
        if (active) setStadium(data);
      } catch (err) {
        if (active)
          setLoadError(getErrorMessage(err, "Couldn't load this stadium."));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [stadiumId, reloadKey, invalid]);

  function retry() {
    setLoading(true);
    setLoadError(null);
    setReloadKey((k) => k + 1);
  }

  // An owner may only manage stadiums they own. If they reach another owner's
  // stadium (e.g. by editing the URL), block the view rather than rendering the
  // management UI for it. Organizers can view any stadium (browse → detail).
  const ownerNoAccess =
    isOwner && stadium !== null && stadium.ownerId !== user?.id;

  return (
    <div className="stadium-detail">
      <button
        className="back-link"
        onClick={() => navigate("/dashboard")}
        type="button"
      >
        <ChevronLeftIcon size={18} />
        {isOwner ? "My Stadiums" : "Browse"}
      </button>

      {invalid && (
        <EmptyState
          icon={<StadiumIcon size={28} />}
          title="Stadium not found"
          message="That stadium link isn't valid."
          action={
            <Button variant="secondary" onClick={() => navigate("/dashboard")}>
              Go back
            </Button>
          }
        />
      )}

      {!invalid && loading && <Spinner label="Loading stadium…" />}

      {!invalid && !loading && loadError && (
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

      {!invalid && !loading && !loadError && ownerNoAccess && (
        <EmptyState
          icon={<StadiumIcon size={28} />}
          title="This stadium isn't yours"
          message="You can only view stadiums you own."
          action={
            <Button variant="secondary" onClick={() => navigate("/dashboard")}>
              Back to My Stadiums
            </Button>
          }
        />
      )}

      {!invalid && !loading && !loadError && stadium && !ownerNoAccess && (
        <>
          <header className="detail-header">
            <h1 className="detail-name">{stadium.name}</h1>
            <p className="detail-location">
              <MapPinIcon size={16} />
              {stadium.location}
            </p>
            <p className="detail-desc">{stadium.description}</p>
          </header>

          {stadium.images.length > 0 ? (
            <section className="gallery">
              <div className="gallery-main">
                <img
                  src={stadium.images[activeImage] ?? stadium.images[0]}
                  alt={stadium.name}
                  className="gallery-main-img"
                />
                {stadium.images.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="gallery-nav gallery-nav-prev"
                      onClick={() =>
                        setActiveImage(
                          (i) =>
                            (i - 1 + stadium.images.length) %
                            stadium.images.length,
                        )
                      }
                      aria-label="Previous image"
                    >
                      <ChevronLeftIcon size={24} />
                    </button>
                    <button
                      type="button"
                      className="gallery-nav gallery-nav-next"
                      onClick={() =>
                        setActiveImage((i) => (i + 1) % stadium.images.length)
                      }
                      aria-label="Next image"
                    >
                      <ChevronRightIcon size={24} />
                    </button>
                    <span className="gallery-counter">
                      {activeImage + 1} / {stadium.images.length}
                    </span>
                  </>
                )}
              </div>
              {stadium.images.length > 1 && (
                <div className="gallery-thumbs">
                  {stadium.images.map((url, i) => (
                    <button
                      key={url}
                      type="button"
                      className={`gallery-thumb ${i === activeImage ? "is-active" : ""}`}
                      onClick={() => setActiveImage(i)}
                      aria-label={`View image ${i + 1}`}
                      aria-pressed={i === activeImage}
                    >
                      <img src={url} alt="" />
                    </button>
                  ))}
                </div>
              )}
            </section>
          ) : (
            <div className="gallery-empty">
              <StadiumIcon size={34} />
              <span>No photos for this stadium</span>
            </div>
          )}

          {isOwner ? (
            <OwnerSlots stadiumId={stadium.id} />
          ) : (
            <OrganizerSlots stadiumId={stadium.id} />
          )}
        </>
      )}
    </div>
  );
}

// Remount on a different :id so loading/stadium/gallery state resets cleanly
// (React Router reuses the component instance across param changes otherwise).
function StadiumDetailRoute() {
  const { id } = useParams();
  return <StadiumDetail key={id} />;
}

export default StadiumDetailRoute;
