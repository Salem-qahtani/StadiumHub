import "./DetailText.css";

type DetailTextProps = {
  text: string;
  color: string;
  dotColor?: string;
};

function DetailText({ text, color, dotColor = "green" }: DetailTextProps) {
  return (
    <>
      <div className="details-container">
        <span className={`glow-dot-${dotColor}`}></span>
        <p className={`details-${color}`}>{text}</p>
      </div>
    </>
  );
}
export default DetailText;
