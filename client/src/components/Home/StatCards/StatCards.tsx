import "./StatCards.css";
import StatCard from "../StatCard/StatCard";

function StatCards() {
  return (
    <div className="stat-container">
      <StatCard number="120" text="Stadium Listed" />
      <StatCard number="2,500" text="Matches Booked" />
      <StatCard number="800" text="Active Users" />
      <StatCard number="24" text="Cities Covered" />
    </div>
  );
}

export default StatCards;
