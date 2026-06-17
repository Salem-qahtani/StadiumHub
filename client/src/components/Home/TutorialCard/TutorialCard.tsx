import "./TutorialCard.css";

type TutorialCardProps = {
  number: string;
  icon: string;
  text: string;
  body: string;
};

function TutorialCard({ number, icon, text, body }: TutorialCardProps) {
  return (
    <div className="tutorial-card">
      <div className="tutorial-card-number">{number}</div>
      <div className="tutorial-card-icon">
        <i className={icon}></i>
      </div>
      <h1 className="tutorial-card-text">{text}</h1>
      <p className="tutorial-card-body">{body}</p>
      <i className="fa-solid fa-arrow-right" id="tutorial-arrow"></i>
    </div>
  );
}

export default TutorialCard;
