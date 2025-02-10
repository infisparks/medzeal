"use client";

import Link from "next/link";
import { useState } from "react";

export default function SearchBar() {
  const [isActive, setIsActive] = useState(false);

  const handleSearchClick = () => {
    setIsActive(!isActive);
  };

  return (
    <>
      <div className="right-bar">
        <div className={`search-top ${isActive ? "active" : ""}`}>
          <div className="search">
            <div className="search-icon" onClick={handleSearchClick}>
              <i className="icofont-search-1"></i>
            </div>
          </div>
          <form className="search-form">
            <input type="text" placeholder="search" name="search" />
            <button value="search" type="submit">
              <i className="icofont-search-1"></i>
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
