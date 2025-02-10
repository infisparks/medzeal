export default function Newsletter() {
  return (
    <section className="newsletter section">
      <div className="container">
        <div className="row">
          <div className="col-lg-6 col-12">
            <div className="subscribe-text">
              <h6>Sign up for our Newsletter</h6>
              <p>
                Stay informed about the latest treatments, wellness tips, and special offers from Medzeal. 
                <br /> Join our community and take a step towards better health!
              </p>
            </div>
          </div>
          <div className="col-lg-6 col-12">
            <div className="subscribe-form">
              <form
                action="mail/mail.php" // Update this action as needed
                method="get"
                className="newsletter-inner"
              >
                <input
                  name="EMAIL"
                  placeholder="Your email address"
                  className="common-input"
                  required
                  type="email"
                />
                <button className="btn">Subscribe</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
