import "./Footer.css";

type FooterProps = {
  // Exact background color for the page the footer sits on.
  bg?: string;
  // Controls text/contrast: "dark" = light text (on dark bg),
  // "light" = dark muted text + top border (on light bg).
  variant?: "dark" | "light";
};

function Footer({ bg, variant = "dark" }: FooterProps) {
  const date = new Date();
  return (
    <div className={`footer ${variant}`} style={{ background: bg }}>
      <div className="copyright">
        &copy;{` ${date.getFullYear()}`} StadiumHub. All rights reserved.{" "}
      </div>
    </div>
  );
}

export default Footer;
