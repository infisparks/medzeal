"use client";

import SectionHead from "@/components/SectionHead";

export default function Services() {
  return (
    <>
      <section className="services section">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <SectionHead
                title="We Offer Different Services To Improve Your Health"
                desc="Dedicated to providing specialized physiotherapy and wellness services for your holistic health."
              />
            </div>
          </div>
          <div className="row">
            {[
              {
                icon: "icofont-therapy",
                title: "Neuro Physiotherapy",
                desc: "Expert care for neurological conditions, enhancing mobility and quality of life.",
              },
              {
                icon: "icofont-lwungs",
                title: "Cardiorespiratory Physiotherapy",
                desc: "Focused treatments for respiratory and cardiac health.",
              },
              {
                icon: "icofont-sport",
                title: "Sports Therapy",
                desc: "Rehabilitation and injury prevention for athletes of all levels.",
              },
              {
                icon: "icofont-speech",
                title: "Speech Therapy",
                desc: "Improving communication skills for better quality of life.",
              },
              {
                icon: "icofont-child",
                title: "Paediatric Physiotherapy",
                desc: "Specialized physiotherapy for children to aid their development.",
              },
              {
                icon: "icofont-wbaby",
                title: "Maternal Physiotherapy",
                desc: "Supporting mothers with tailored therapies for pregnancy and postpartum recovery.",
              },
              {
                icon: "icofont-massage",
                title: "Massage Therapy",
                desc: "Therapeutic massage to promote relaxation and well-being.",
              },
              {
                icon: "icofont-yoga",
                title: "Yoga",
                desc: "Guided sessions to enhance flexibility and mindfulness.",
              },
              {
                icon: "icofont-acupuncture",
                title: "Acupuncture",
                desc: "Holistic treatment for pain relief and health improvement.",
              },
            ].map((service, index) => (
              <div key={index} className="col-lg-4 col-md-6 col-12 mb-4">
                <div className="card shadow border-0 hover-shadow">
                  <div className="card-body text-center">
                    <i className={`${service.icon} mb-3`} style={{ fontSize: '2rem' }}></i>
                    <h5 className="card-title">{service.title}</h5>
                    <p className="card-text">{service.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <style jsx>{`
        .hover-shadow {
          transition: box-shadow 0.3s ease;
        }
        .hover-shadow:hover {
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </>
  );
}
