import "./HowItWork.css";
import DetailText from "../DetailText/DetailText";
import TutorialCard from "../TutorialCard/TutorialCard";

function HowItWork() {
  return (
    <div className="how-it-work-section" id="howItWork">
      <div className="how-it-work-header">
        <DetailText text="HOW IT WORKS" color="green" />
        <h2 className="how-it-work-title">
          Three steps from <span className="kick">kickoff</span> to full-time.{" "}
        </h2>
      </div>
      <hr className="my-hr" />
      <div className="tutorial-cards-container">
        <TutorialCard
          number="01"
          icon="fa-solid fa-magnifying-glass"
          text="Browse Stadiums"
          body="Filter by city, surface, lighting and price. Compare photos, amenities, and reviews from fellow organizers."
        />
        <TutorialCard
          number="02"
          icon="fa-regular fa-calendar"
          text="Reserve Time Slots"
          body="Pick a date, lock in the hour, and pay securely. Instant confirmation with a calendar invite for your squad."
        />
        <TutorialCard
          number="03"
          icon="fa-regular fa-message"
          text="Message Owners"
          body="Coordinate logistics directly with stadium owners. Ask about equipment, request late-night slots, settle the details."
        />
      </div>
    </div>
  );
}

export default HowItWork;
