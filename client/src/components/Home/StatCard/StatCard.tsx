import "./StatCard.css";

type StatCardProps = {
  number: string;
  text: string;
};

function StatCard({ number, text }: StatCardProps) {
  return (
    <>
      <div className="stat-card-container">
        <div className="stat-number">{`${number}+`}</div>
        <div className="stat-text">{text}</div>
      </div>
    </>
  );
}
export default StatCard;
