"use client";

import { useState } from "react";

export default function Mission() {
  const [missionData, setMissionData] = useState([
    {
      id: "item1",
      icon: "icofont-doctor",
      title: "Professional Staff",
      desc: "Dedicated professionals providing personalized care to support your health journey.",
    },
    {
      id: "item2",
      icon: "icofont-kid",
      title: "Comprehensive Physiotherapy",
      desc: "Specialized physiotherapy services tailored to meet individual needs.",
    },
    {
      id: "item3",
      icon: "icofont-laboratory",
      title: "Holistic Wellness Programs",
      desc: "Integrative wellness services to promote overall health and well-being.",
    },
    {
      id: "item4",
      icon: "icofont-tooth",
      title: "Community Outreach",
      desc: "Engaging the community through educational resources and health initiatives.",
    },
  ]);

  return (
    <>
      <section className="our-mission-area ptb-100 pt-0">
        <div className="container-fluid p-0">
          <div className="row m-0">
            <div className="col-lg-6 col-md-12 p-0">
              <div className="our-mission-content">
                <span className="sub-title">Our Mission & Vision</span>
                <h2>Empowering Health Through Care</h2>
                <p>
                  At Medzeal, we are committed to enhancing quality of life through specialized physiotherapy and holistic wellness services.
                </p>
                <ul>
                  {missionData.map((items) => (
                    <li key={items.id}>
                      <div className="icon">
                        <i className={items.icon}></i>
                      </div>
                      <span>{items.title}</span>
                      <p>{items.desc}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="col-lg-6 col-md-12 p-0">
              <div className="our-mission-image"></div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
