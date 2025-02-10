"use client";

import Breadcrumbs from "@/components/Breadcrumbs";
import Clients from "../Home/Clients";
import Header from "@/components/Header/Header";
import { useState } from "react";

export default function Service() {
  return (
    <>
      <Header />
      <Breadcrumbs title="Our Services" menuText="Services" />

      {/* Physiotherapy Services Section */}
      <section className="services section py-5">
        <div className="container">
          <h1 className="text-center mb-4">Physiotherapy Services</h1>
          <p className="text-center">
            At Medzeal Mumbra, we provide expert physiotherapy services to help you recover from injuries and improve mobility. Explore our comprehensive services below:
          </p>
          <div className="row">
            {physiotherapyServices.map((service) => (
              <div className="col-lg-4 col-md-6 col-12 mb-4" key={service.title}>
                <ServiceCard service={service} />
              </div>
            ))}
          </div>
          <br></br>
          <h2 className="text-center mb-4">Wellness Center Services</h2>
          <p className="text-center">
            Our wellness center offers a range of holistic treatments designed to improve your overall well-being. Choose from yoga, massage, chiropractic services, and more.
          </p>
          <div className="row">
            {wellnessServices.map((service) => (
              <div className="col-lg-4 col-md-6 col-12 mb-4" key={service.title}>
                <ServiceCard service={service} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <Clients />
    </>
  );
}

const ServiceCard = ({ service }) => {
  return (
    <div
      className="card shadow border-0 h-100"
      style={{
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div className="card-body text-center">
        <div className="icon mb-3">
          <i className={service.icon} style={{ fontSize: '40px', color: '#007bff' }}></i>
        </div>
        <h3 className="card-title">{service.title}</h3>
        <p className="card-text">{service.desc}</p>
      </div>
    </div>
  );
};

const physiotherapyServices = [
  { icon: "icofont-physiotherapist", title: "Neuro Physiotherapy", desc: "Specialized physiotherapy for neurological conditions, helping you recover and manage symptoms." },
  { icon: "icofont-physiotherapist", title: "Cardiorespiratory Physiotherapy", desc: "Treatment for respiratory and cardiovascular conditions to improve breathing and heart function." },
  { icon: "icofont-physiotherapist", title: "Sports Therapy", desc: "Therapy to enhance athletic performance and aid in faster recovery from sports injuries." },
  { icon: "icofont-physiotherapist", title: "Speech Therapy", desc: "Therapy designed to address speech and language disorders, improving communication skills." },
  { icon: "icofont-physiotherapist", title: "Paediatric Physiotherapy", desc: "Specialized care focusing on children's physical development and needs." },
  { icon: "icofont-physiotherapist", title: "Orthopaedic Physiotherapy", desc: "Rehabilitation for musculoskeletal injuries, helping you regain strength and mobility." },
  { icon: "icofont-physiotherapist", title: "Post-Op Physiotherapy", desc: "Rehabilitation services following surgery to ensure a smooth and speedy recovery." },
  { icon: "icofont-physiotherapist", title: "Geriatric Physiotherapy", desc: "Physiotherapy focused on improving mobility and quality of life for older adults." },
  { icon: "icofont-physiotherapist", title: "Maternal Physiotherapy", desc: "Comprehensive care for pregnant and postpartum women, promoting recovery and health." },
];

const wellnessServices = [
  { icon: "icofont-massage", title: "Massage Therapy", desc: "Experience relaxing and therapeutic massages to relieve stress and promote wellness." },
  { icon: "icofont-yoga", title: "Yoga", desc: "Join guided yoga sessions for physical and mental well-being, tailored for all skill levels." },
  { icon: "icofont-acupuncture", title: "Acupuncture", desc: "Traditional therapy using acupuncture for pain relief, improved circulation, and healing." },
  { icon: "icofont-nutrition", title: "Clinical Nutrition Counselling", desc: "Get personalized nutrition plans to enhance your health and well-being." },
  { icon: "icofont-vr", title: "VR Therapy", desc: "Innovative virtual reality therapy to help with anxiety, phobias, and mental health." },
  { icon: "icofont-sensory", title: "Sensory Desensitization", desc: "Specialized therapy designed to reduce sensitivity to various stimuli." },
  { icon: "icofont-rehab", title: "De-addiction Programs", desc: "Get support through structured programs to overcome addiction and lead a healthier life." },
  { icon: "icofont-hijama", title: "Hijama Therapy", desc: "Cupping therapy for detoxification, improved circulation, and pain relief." },
  { icon: "icofont-chiropractic", title: "Chiropractic Services", desc: "Manual therapy to promote spinal health and joint mobility." },
];
