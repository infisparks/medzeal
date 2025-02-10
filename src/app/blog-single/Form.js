export default function Form() {
  return (
    <>
      <div className="comments-form">
        <h2>Leave Comments</h2>

        <form className="form" method="post" action="mail/mail.php">
          <div className="row">
            <div className="col-lg-4 col-md-4 col-12">
              <div className="form-group">
                <i className="fa fa-user"></i>
                <input
                  type="text"
                  name="first-name"
                  placeholder="First name"
                  required="required"
                />
              </div>
            </div>
            <div className="col-lg-4 col-md-4 col-12">
              <div className="form-group">
                <i className="fa fa-envelope"></i>
                <input
                  type="text"
                  name="last-name"
                  placeholder="Last name"
                  required="required"
                />
              </div>
            </div>
            <div className="col-lg-4 col-md-4 col-12">
              <div className="form-group">
                <i className="fa fa-envelope"></i>
                <input
                  type="email"
                  name="email"
                  placeholder="Your Email"
                  required="required"
                />
              </div>
            </div>
            <div className="col-12">
              <div className="form-group message">
                <i className="fa fa-pencil"></i>
                <textarea
                  name="message"
                  rows="7"
                  placeholder="Type Your Message Here"
                ></textarea>
              </div>
            </div>
            <div className="col-12">
              <div className="form-group button">
                <button type="submit" className="btn primary">
                  <i className="fa fa-send"></i>Submit Comment
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
