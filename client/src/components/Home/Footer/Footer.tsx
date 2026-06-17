import "./Footer.css";

function Footer() {
  const date = new Date();
  return (
    <div className="footer">
      <div className="copyright">
        &copy;{` ${date.getFullYear()}`} StadiumHub. All rights reserved.{" "}
      </div>
    </div>
  );
}

export default Footer;
