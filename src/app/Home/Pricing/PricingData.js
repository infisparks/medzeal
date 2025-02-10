import Link from "next/link";

const Data = [
  {
    title: "Neuro Physiotherapy",
    icon: "icofont-therapy",
    features: [
      { name: "Personalized treatment plans", status: true },
      { name: "Expert neurologist consultations", status: true },
      { name: "Advanced rehabilitation techniques", status: true },
      { name: "Continuous progress monitoring", status: true },
    ],
  },
  {
    title: "Cardiorespiratory Physiotherapy",
    icon: "icofont-lungs",
    features: [
      { name: "Breathing exercises and techniques", status: true },
      { name: "Tailored cardiovascular programs", status: true },
      { name: "Post-operative recovery support", status: true },
      { name: "Patient education and support", status: true },
    ],
  },
  {
    title: "Sports Therapy",
    icon: "icofont-sport",
    features: [
      { name: "Injury prevention strategies", status: true },
      { name: "Rehabilitation for athletes", status: true },
      { name: "Customized exercise programs", status: true },
      { name: "Performance enhancement techniques", status: true },
    ],
  },
];

export default function PricingData() {
  return (
    <>
      {Data.map((pricing, index) => (
        <div key={index} className="col-lg-4 col-md-12 col-12">
          <div className="single-table">
            <div className="table-head">
              <div className="icon">
                <i className={`icofont ${pricing.icon}`}></i>
              </div>
              <h4 className="title">{pricing.title}</h4>
            </div>
            <ul className="table-list">
              {pricing.features.map((feature, index) => (
                <li key={index} className={feature.status ? "" : "cross"}>
                  {feature.status ? (
                    <i className="icofont icofont-ui-check"></i>
                  ) : (
                    <i className="icofont icofont-ui-close"></i>
                  )}
                  {feature.name}
                </li>
              ))}
            </ul>
            <div className="table-bottom">
              <Link className="btn" href="#">
                Book Now
              </Link>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
