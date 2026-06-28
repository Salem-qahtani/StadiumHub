import "./ForCard.css";
import DetailText from "../DetailText/DetailText";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import type { Dispatch, SetStateAction } from "react";

type ForCardProps = {
  label: string;
  labelColor: string;
  title: string;
  body: string;
  checkItems: string[];
  buttonText: string;
  for: string;
  setIsSignIn: Dispatch<SetStateAction<boolean | null>>;
};

function ForCard({
  label,
  labelColor,
  title,
  body,
  checkItems,
  buttonText,
  for: cardFor,
  setIsSignIn,
}: ForCardProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  function handleNavigate(role: string) {
    if (isAuthenticated) {
      navigate("/dashboard");
      return;
    }
    setIsSignIn(false);
    navigate("/sign", { state: { role: role } });
  }
  return (
    <div className={`${cardFor}-card`}>
      <DetailText text={label} color={labelColor} />
      <h3 className={`${cardFor}-title`}>{title}</h3>
      <p className={`${cardFor}-body`}>{body}</p>
      <div className={`${cardFor}-checklist`}>
        {checkItems.map((item, index) => (
          <div className={`${cardFor}-check-item`} key={index}>
            <i className="fa-solid fa-square-check"></i>
            <span>{item}</span>
          </div>
        ))}
      </div>
      <button
        className={`${cardFor}-button`}
        onClick={() => {
          handleNavigate(cardFor);
        }}
      >
        {buttonText}
        <i className="fa-solid fa-arrow-right"></i>
      </button>
    </div>
  );
}

export default ForCard;
