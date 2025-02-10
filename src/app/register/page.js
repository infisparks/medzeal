import Breadcrumbs from "@/components/Breadcrumbs";
import Header from "@/components/Header/Header";
import Link from "next/link";

export default function register() {
  return (
    <>
      <Header />

      <Breadcrumbs title="Register" menuText="Register" />

      <section className="register section">
        <div className="container">
          <div className="inner">
            <div className="row">
              <div className="col-lg-6">
                <div className="register-left"></div>
              </div>
              <div className="col-lg-6">
                <div className="register-form">
                  <h2>Register Here</h2>
                  <p>
                    Already have an account ?{" "}
                    <Link href="/login">Login Here</Link>
                  </p>
                  <form className="form" method="post" action="#">
                    <div className="row">
                      <div className="col-lg-6">
                        <div className="form-group">
                          <input
                            type="text"
                            name="name"
                            placeholder="First Name"
                            required=""
                          />
                        </div>
                      </div>
                      <div className="col-lg-6">
                        <div className="form-group">
                          <input
                            type="text"
                            name="name"
                            placeholder="Last Name"
                            required=""
                          />
                        </div>
                      </div>
                      <div className="col-lg-6">
                        <div className="form-group">
                          <input
                            type="email"
                            name="email"
                            placeholder="Phone"
                            required=""
                          />
                        </div>
                      </div>
                      <div className="col-lg-6">
                        <div className="form-group">
                          <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            required=""
                          />
                        </div>
                      </div>
                      <div className="col-lg-6">
                        <div className="form-group">
                          <input
                            type="password"
                            name="password"
                            placeholder="Password"
                            required=""
                          />
                        </div>
                      </div>
                      <div className="col-lg-6">
                        <div className="form-group">
                          <input
                            type="password"
                            name="password"
                            placeholder="Confirm Password"
                            required=""
                          />
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="form-group login-btn">
                          <button className="btn" type="submit">
                            Login
                          </button>
                        </div>
                        <div className="checkbox">
                          <div class="form-check">
                            <input
                              class="form-check-input"
                              type="checkbox"
                              value=""
                              id="flexCheckDefault"
                            />
                            <label
                              class="form-check-label"
                              for="flexCheckDefault"
                            >
                              Yes, I agree with all
                            </label>
                          </div>
                        </div>
                        <Link href="#" className="terms">
                          Terms & Conditions
                        </Link>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
