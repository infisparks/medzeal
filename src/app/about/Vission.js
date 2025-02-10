"use client";

import { useState } from "react";

export default function Vission() {
  const [vissionData, setvissionData] = useState([
    {
      id: "item1",
      icon: "icofont-tick-mark",
      title: "Our Mission",
      desc: "At Medzeal, our mission is to enhance the quality of life for our patients through specialized physiotherapy and holistic wellness services.",
    },
    {
      id: "item2",
      icon: "icofont-tick-mark",
      title: "Our Planning",
      desc: "At Medzeal, we provide personalized treatment plans, holistic wellness integration, and community outreach to empower patients in their health journeys.",
    },
    {
      id: "item3",
      icon: "icofont-tick-mark",
      title: "Our Vision",
      desc: "Our vision is to be a leading holistic health provider, empowering individuals to achieve optimal well-being through innovative therapies and support.",
    },
  ]);

  return (
    <>
      <section className="our-vision-area ptb-100 pt-0">
        <div className="container">
          <div className="row">
            {vissionData.map((items) => (
              <div className="col-lg-4 col-md-6 col-12" key={items.id}>
                <div className="single-vision-box">
                  <div className="icon">
                    <i className={items.icon}></i>
                  </div>
                  <h3>{items.title}</h3>
                  <p>{items.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
