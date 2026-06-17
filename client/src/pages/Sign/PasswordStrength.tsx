import "./PasswordStrength.css";
import type { Dispatch, SetStateAction, ChangeEvent } from "react";

type PasswordStrengthProps = {
  onChange: (value: string) => void;
  password: string;
  strength: string;
  setStrength: Dispatch<SetStateAction<string>>;
  disabled?: boolean;
};

function PasswordStrength({
  onChange,
  password,
  strength,
  setStrength,
}: PasswordStrengthProps) {
  function getPassStrength(pass: string): string {
    const password = String(pass);
    const sympoles = [
      "!",
      "@",
      "#",
      "$",
      "%",
      "^",
      "&",
      "*",
      "(",
      ")",
      "-",
      "_",
      "+",
      "=",
      "[",
      "]",
      "{",
      "}",
      "|",
      "\\",
      ";",
      ":",
      "'",
      '"',
      ",",
      ".",
      "<",
      ">",
      "/",
      "?",
      "`",
      "~",
    ];
    const length = password.length;
    const haveSympoles = (p: string) => sympoles.some((sym) => p.includes(sym));
    const haveCapital = (p: string) => /[A-Z]/.test(p);

    if (length >= 12 && haveSympoles(password) && haveCapital(password)) {
      return "Strong";
    } else if (
      length >= 8 &&
      (haveSympoles(password) || haveCapital(password))
    ) {
      return "Medium";
    } else if (length === 0) {
      return "-";
    } else {
      return "Weak";
    }
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setStrength(getPassStrength(val));
    onChange(val);
  }

  return (
    <>
      <input
        type="password"
        placeholder="Password"
        onChange={handleChange}
        value={password}
      />
      <div className="pass-bar-container">
        <div className={`password-bar-${strength}`}></div>
      </div>
      <div className="password-container">
        <p className="password-body">PASSWORD STRENGTH</p>
        <p className={`password-strength-${strength}`}>{strength}</p>
      </div>
    </>
  );
}

export default PasswordStrength;
