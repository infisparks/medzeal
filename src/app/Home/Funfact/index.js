import FunfactCard from "@/components/FunfactCard";

export default function Funfact() {
  return (
    <>
      <div id="fun-facts" className="fun-facts section overlay">
        <div className="container">
          <div className="row">
            <div className="col-lg-3 col-md-6 col-12">
              <FunfactCard
                icon="icofont icofont-home"
                number="3468"
                desc="Hospital Rooms"
              />
            </div>
            <div className="col-lg-3 col-md-6 col-12">
              <FunfactCard
                icon="icofont icofont-user-alt-3"
                number="557"
                desc="Specialist Doctors"
              />
            </div>
            <div className="col-lg-3 col-md-6 col-12">
              <FunfactCard
                icon="icofont-simple-smile"
                number="4379"
                desc="Happy Patients"
              />
            </div>
            <div className="col-lg-3 col-md-6 col-12">
              <FunfactCard
                icon="icofont icofont-table"
                number="32"
                desc="Years of Experience"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
