export default function NotFound() {
  return (
    <>
      <section className="error-page section">
        <div className="container">
          <div className="row">
            <div className="col-lg-6 offset-lg-3 col-12">
              <div className="error-inner">
                <h1>
                  404<span>Oop&apos;s sorry we can&apos;t find that page!</span>
                </h1>
                <p>
                  Aenean eget sollicitudin lorem, et pretium felis. Nullam
                  euismod diam libero, sed dapibus leo laoreet ut. Suspendisse
                  potenti. Phasellus urna lacus
                </p>
                <form className="search-form">
                  <input placeholder="Search from Here" type="text" />
                  <button className="btn" type="submit">
                    <i className="fa fa-search"></i>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
