"use client";

import Image from "next/image";
import Link from "next/link";
import { Tilt } from "react-tilt";
import TeamImg1 from "../../../public/img/team1.jpg";
import { useRouter } from "next/navigation";

const defaultOptions = {
  reverse: false,
  max: 35,
  perspective: 1000,
  scale: 1,
  speed: 2000,
  transition: true,
  axis: null,
  reset: true,
  easing: "cubic-bezier(.03,.98,.52,.99)",
};

export default function TeamCard(props) {
  const { tilt, image, name, designation, uid } = props;
  const router = useRouter();

  const handleCardClick = () => {
    // Redirect to the DoctorDetails page with uid as a query parameter
    router.push(`/doctor-details?uid=${uid}`);
  };

  const handleAppointmentClick = (e) => {
    e.stopPropagation(); // Prevent the card click event from firing
    // Redirect to the appointment page with doctor's UID and name as query parameters
    router.push(`/appointment?doctor=${uid}&doctorName=${encodeURIComponent(name)}`);
  };

  return (
    <Tilt options={defaultOptions} className={tilt ? tilt : ""}>
      <div className="single-team" onClick={handleCardClick}>
        <div className="t-head">
          <Image
            className="card-img-top team-image"
            src={image || TeamImg1}
            alt={name || "Team Member"}
            width={200}
            height={200}
          />
          <div className="t-icon">
           
          </div>
        </div>
        <div className="t-bottom">
          <p>{designation || "Neurosurgeon"}</p>
          <h2>
            <Link href="#" onClick={(e) => e.stopPropagation()}>
              {name || "Collis Molate"}
            </Link>
          </h2>
        </div>
      </div>
    </Tilt>
  );
}
