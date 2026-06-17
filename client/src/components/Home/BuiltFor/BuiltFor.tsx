import "./BuiltFor.css";
import DetailText from "../DetailText/DetailText";
import ForCard from "../ForCard/ForCard";
import type { Dispatch, SetStateAction } from "react";

type BuiltForProps = {
  setIsSignIn: Dispatch<SetStateAction<boolean | null>>;
};

function BuiltFor({ setIsSignIn }: BuiltForProps) {
  return (
    <div className="built-for-section" id="builtFor">
      <DetailText text="BUILT FOR EVERYONE" color="white" />
      <hr className="my-hr" />
      <h2 className="built-for-title">
        Two sides of the <span className="built-for-game">same </span>game.
      </h2>
      <p className="built-for-body">
        Whether you run the pitch or play on it — StadiumHub gives you the tools
        you actually need. No fluff, no commission tricks, no fake bookings.
      </p>
      <div className="for-cards-container">
        <ForCard
          for="owner"
          label="FOR OWNERS"
          labelColor="white"
          title="Stadium Owners"
          body="List your facility, set your hours, and let bookings come to you."
          checkItems={[
            "List unlimited stadiums and pitches",
            "Custom availability calendar by hour",
            "Direct messaging with organizers",
            "Real-time booking & revenue dashboard",
          ]}
          buttonText="LIST YOUR STADIUM"
          setIsSignIn={setIsSignIn}
        />
        <ForCard
          for="organizer"
          label="FOR ORGANIZERS"
          labelColor="green"
          title="Match Organizers"
          body="Find the right pitch, lock the slot, and rally your team fast."
          checkItems={[
            "Search by city, surface, and price",
            "Instant booking confirmation",
            "Save favorite stadiums for quick rebooks",
            "Squad coordination + match reminders",
          ]}
          buttonText="FIND A STADIUM"
          setIsSignIn={setIsSignIn}
        />
      </div>
    </div>
  );
}

export default BuiltFor;
