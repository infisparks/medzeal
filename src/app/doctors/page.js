"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; 
import Breadcrumbs from "@/components/Breadcrumbs";
import TeamCard from "@/components/TeamCard";
import Header from "@/components/Header/Header";
import { db } from "../../lib/firebaseConfig"; 
import { ref, get, child } from "firebase/database";
import Image from "next/image";
import doctorimg from "../../../public/img/author2.jpg"; 

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const router = useRouter(); 

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const dbRef = ref(db);
        const snapshot = await get(child(dbRef, "doctors"));
        if (snapshot.exists()) {
          const doctorsData = [];
          snapshot.forEach((childSnapshot) => {
            const data = childSnapshot.val();
            doctorsData.push({ ...data, uid: childSnapshot.key });
          });
          setDoctors(doctorsData);
          console.log("Fetched doctors:", doctorsData); 
        } else {
          console.log("No data available");
        }
      } catch (error) {
        console.error("Error fetching doctors: ", error);
      }
    };

    fetchDoctors();
  }, []);

  const handleSelectDoctor = (doctor) => {
    const { uid } = doctor;
    console.log("Doctor selected:", uid);
    if (uid) { 
      router.push(`/doctor-details?uid=${uid}`); 
    } else {
      console.error("Doctor UID is undefined");
    }
  };

  return (
    <>
      <Header />
      <Breadcrumbs title="Meet Our Qualified Doctors" menuText="Doctors" />

      <section id="team" className="team section single-page">
        <div className="container">
          <div className="row">
            {doctors.map((doctor) => {
              const imageUrl = doctor.photoURL || doctorimg.src;
              return (
                <div key={doctor.uid} className="col-lg-4 col-md-6 col-12">
                  <div onClick={() => handleSelectDoctor(doctor)} style={{ cursor: "pointer" }}>
                    <TeamCard
                      tilt="tilt-disable"
                      image={imageUrl}
                      name={doctor.name}
                      designation={doctor.role}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
