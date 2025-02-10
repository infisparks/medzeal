export default function Newsletter() {
  return (
    <div className="col-lg-3 col-md-6 col-12">
      <div className="single-footer">
        <h2>Newsletter</h2>
        <p>
          Subscribe to our newsletter to receive the latest updates, health tips, and exclusive offers from Medzeal directly in your inbox.
        </p>
        <form
          action="mail/mail.php" // Update this action as needed
          method="get"
          className="newsletter-inner"
        >
          <input
            name="email"
            placeholder="Email Address"
            className="common-input"
            required
            type="email"
          />
          <button className="button" type="submit">
            <i className="icofont icofont-paper-plane"></i>
          </button>
        </form>
      </div>
    </div>
  );
}
