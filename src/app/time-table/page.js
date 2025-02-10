import Breadcrumbs from "@/components/Breadcrumbs";
import SectionHead from "@/components/SectionHead";
import DoctorSchedule from "./DoctorSchedule";
import Header from "@/components/Header/Header";

export default function TimeTable() {
  return (
    <>
      <Header />

      <Breadcrumbs title="Time Table" menuText="Time Table" />

      <section className="doctor-calendar-area section">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <SectionHead
                title="Determine Your Date to Come"
                desc="Medzeal Doctor time table"
              />
            </div>
          </div>
          <div className="row">
            <div className="col-12">
              <DoctorSchedule />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
