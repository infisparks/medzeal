"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; 
import Image from "next/image";
import Link from "next/link";
import Head from "next/head"; // Import Head for SEO tags
import Breadcrumbs from "@/components/Breadcrumbs";
import Header from "@/components/Header/Header";
import { db } from "../../lib/firebaseConfig"; 
import { ref, get, child } from "firebase/database";

const LoadingSkeleton = () => (
  <div style={{ display: "flex", flexDirection: "row", marginBottom: "20px" }}>
    <div style={{ width: "100%", height: "200px", background: "#e0e0e0", borderRadius: "4px", marginRight: "20px" }}></div>
    <div style={{ flex: 1 }}>
      <div style={{ background: "#e0e0e0", width: "70%", height: "20px", margin: "10px 0", borderRadius: "4px" }}></div>
      <div style={{ background: "#e0e0e0", width: "50%", height: "15px", margin: "10px 0", borderRadius: "4px" }}></div>
      <div style={{ background: "#e0e0e0", width: "100%", height: "15px", margin: "10px 0", borderRadius: "4px" }}></div>
      <div style={{ background: "#e0e0e0", width: "100%", height: "15px", margin: "10px 0", borderRadius: "4px" }}></div>
      <div style={{ background: "#e0e0e0", width: "100%", height: "15px", margin: "10px 0", borderRadius: "4px" }}></div>
    </div>
  </div>
);

export default function DoctorDetails() {
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [uid, setUid] = useState(null); // State to hold the uid

  useEffect(() => {
    // Get the uid from the URL after component mounts
    const currentUid = new URLSearchParams(window.location.search).get("uid");
    setUid(currentUid); // Set uid state
  }, []);

  useEffect(() => {
    if (uid) {
      const fetchDoctorDetails = async () => {
        setLoading(true);
        const cachedDoctor = localStorage.getItem(`doctor_${uid}`);
        
        if (cachedDoctor) {
          setDoctor(JSON.parse(cachedDoctor));
          setLoading(false);
        }

        try {
          const dbRef = ref(db);
          const snapshot = await get(child(dbRef, `doctors/${uid}`));
          if (snapshot.exists()) {
            const doctorData = snapshot.val();
            setDoctor(doctorData);
            localStorage.setItem(`doctor_${uid}`, JSON.stringify(doctorData)); // Cache in local storage
            console.log("Fetched doctor:", doctorData);
          } else {
            console.log("No data available");
          }
        } catch (error) {
          console.error("Error fetching doctor details: ", error);
        } finally {
          setLoading(false);
        }
      };

      fetchDoctorDetails();
    }
  }, [uid]); // Fetch doctor details only if uid is set

  if (loading) {
    return <LoadingSkeleton />; // Show skeleton while loading
  }

  if (!doctor) {
    return <p>No doctor found.</p>; // Handle case where no doctor data is available
  }

  return (
    <>
      {/* SEO Meta Tags */}
      <Head>
        <title>{`${doctor.name} - ${doctor.role} | Medzeal Mumbra`}</title>
        <meta name="description" content={`${doctor.name} is a highly qualified ${doctor.role} with expertise in ${doctor.specialization || doctor.role}. Book an appointment at Medzeal Mumbra today.`} />
        <meta name="keywords" content={`${doctor.name}, ${doctor.role}, ${doctor.specialization}, Medzeal Mumbra, doctors in Mumbra, physiotherapists, wellness center`} />
        <meta property="og:title" content={`${doctor.name} - ${doctor.role} | Medzeal Mumbra`} />
        <meta property="og:description" content={`${doctor.name} is a highly qualified ${doctor.role} with expertise in ${doctor.specialization}.`} />
        <meta property="og:image" content={doctor.photoURL} />
        <meta property="og:type" content="website" />
      </Head>

      <Header />
      <Breadcrumbs title="Doctor Details" menuText="Doctor Details" />

      <div className="doctor-details-area section">
        <div className="container">
          <div className="row">
            <div className="col-lg-5">
              <div className="doctor-details-item doctor-details-left">
                <Image src={doctor.photoURL} alt={doctor.name} width={479} height={551} />
                <div className="doctor-details-contact">
                  <h3>Contact info</h3>
                  <ul className="basic-info">
                    <li>
                      <i className="icofont-ui-call"></i>
                      Call : {doctor.phone}
                    </li>
                    <li>
                      <i className="icofont-ui-message"></i>
                      {doctor.email}
                    </li>
                    <li>
                      <i className="icofont-location-pin"></i>
                      {doctor.location}
                    </li>
                  </ul>

                  <ul className="social">
                    <li>
                      <Link href="#">
                        <i className="icofont-facebook"></i>
                      </Link>
                    </li>
                    <li>
                      <Link href="#">
                        <i className="icofont-google-plus"></i>
                      </Link>
                    </li>
                    <li>
                      <Link href="#">
                        <i className="icofont-twitter"></i>
                      </Link>
                    </li>
                    <li>
                      <Link href="#">
                        <i className="icofont-vimeo"></i>
                      </Link>
                    </li>
                    <li>
                      <Link href="#">
                        <i className="icofont-pinterest"></i>
                      </Link>
                    </li>
                  </ul>

                  <div className="doctor-details-work">
                    <h3>Working hours</h3>
                    <ul className="time-sidual">
                      {Object.entries(doctor.workingHours).map(([day, hours]) => (
                        <li key={day} className="day">
                          {day.charAt(0).toUpperCase() + day.slice(1)} <span>{hours.notWorking ? "Not working" : `${hours.start}-${hours.end}`}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-7">
              <div className="doctor-details-item">
                <div className="doctor-details-right">
                  <div className="doctor-name">
                    <h3 className="name">{doctor.name}</h3>
                    <p className="deg">{doctor.role}</p>
                    <p className="degree">{doctor.education}</p>
                  </div>
                  <div className="doctor-details-biography">
                    <h3>Biography</h3>
                    <p>{doctor.biography}</p>
                  </div>
                  <div className="doctor-details-biography">
                    <h3>Education</h3>
                    <ul>
                      <li>{doctor.education}</li>
                      {/* Add more education details if available */}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
