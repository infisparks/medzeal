"use client";

import CountUp from "react-countup";

export default function FunfactCard(props) {
  const { icon, number, desc } = props;

  return (
    <>
      <div className="single-fun">
        <i className={icon ? icon : "icofont icofont-home"}></i>
        <div className="content">
          <span className="counter">
            <CountUp end={number ? number : "3468"} delay={1} enableScrollSpy />
          </span>
          <p>{desc ? desc : "Hospital Rooms"}</p>
        </div>
      </div>
    </>
  );
}
