import SectionHead from "@/components/SectionHead";
import TeamCard from "@/components/TeamCard";

import SectionImg from "../../../../public/img/section-img2.png";

import TeamImg1 from "../../../../public/img/team1.jpg";
import TeamImg2 from "../../../../public/img/team2.jpg";
import TeamImg3 from "../../../../public/img/team3.jpg";
import TeamImg4 from "../../../../public/img/team4.jpg";

export default function Team() {
  return (
    <>
      <section id="team" className="team section overlay">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <SectionHead
                img={SectionImg}
                title="We Have Specialist Doctors To Solve Your Problems"
                desc="Lorem ipsum dolor sit amet consectetur adipiscing elit praesent aliquet. pretiumts"
              />
            </div>
          </div>
          <div className="row">
            <div className="col-lg-3 col-md-6 col-12">
              <TeamCard
                image={TeamImg1}
                name="Collis Molate"
                designation="Neurosurgeon"
              />
            </div>
            <div className="col-lg-3 col-md-6 col-12 ">
              <TeamCard
                image={TeamImg2}
                name="Domani Plavon"
                designation="Neurosurgeon"
              />
            </div>
            <div className="col-lg-3 col-md-6 col-12 ">
              <TeamCard
                image={TeamImg3}
                name="John Mard"
                designation="Dental Surgeon"
              />
            </div>
            <div className="col-lg-3 col-md-6 col-12">
              <TeamCard
                image={TeamImg4}
                name="Amanal Frond"
                designation="Neurosurgeon"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
