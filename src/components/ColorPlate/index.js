"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function ColorPlate() {
  const colors = [
    "#1A76D1",
    "#2196F3",
    "#32B87D",
    "#FE754A",
    "#F82F56",
    "#01B2B7",
    "#6C5CE7",
    "#85BA46",
    "#273C75",
    "#FD7272",
    "#BADC58",
    "#44CE6F",
  ];

  const [primaryColor, setPrimaryColor] = useState(colors[0]);

  useEffect(() => {
    document.documentElement.style.setProperty("--primary-color", primaryColor);
  }, [primaryColor]);

  const handleColorClick = (color) => {
    setPrimaryColor(color);
  };

  const [optionsOpen, setOptionsOpen] = useState(false);

  const toggleOptions = () => {
    setOptionsOpen(!optionsOpen);
  };

  return (
    <>
      <div className={`color-plate  ${optionsOpen ? "active" : ""}`}>
        <div className="color-plate-icon" onClick={toggleOptions}>
          <i className="fa fa-cog fa-spin"></i>
        </div>
        <h4>Mediplus</h4>
        <p>Here is some awesome color&apos;s available on Mediplus Template.</p>
        {colors.map((color, index) => (
          <ColorOption key={index} color={color} onClick={handleColorClick} />
        ))}
      </div>
    </>
  );
}

const ColorOption = ({ color, onClick }) => {
  return (
    <div
      className="color-option"
      style={{
        backgroundColor: color,
      }}
      onClick={() => onClick(color)}
    ></div>
  );
};
