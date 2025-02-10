"use client";

import useStickyHeader from "./useStickyHeader";

import Navbar from "../Navbar";
import SearchBar from "../SearchBar";

export default function HeaderInner2() {
  const { isSticky } = useStickyHeader();

  return (
    <>
      <div className={`header-inner ${isSticky ? "sticky" : ""}`}>
        <div className="container">
          <div className="inner">
            <div className="row">
              <div className="col-12">
                <Navbar />
                <SearchBar />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
