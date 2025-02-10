"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebaseConfig"; // Adjust the path according to your Firebase setup
import useStickyHeader from "./useStickyHeader";

import Logo from "../Logo";
import Navbar from "../Navbar";
import MobileOffcanvas from "@/components/MobileOffcanvas";

export default function HeaderInner() {
  const { isSticky } = useStickyHeader();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setUser(null); // Update state after logging out
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <div className={`header-inner ${isSticky ? "sticky" : ""}`}>
      <div className="container">
        <div className="inner">
          <div className="row">
            <div className="col-lg-3 col-md-3 col-12 mobile-menu-sticky">
              <Logo />
              <MobileOffcanvas />
            </div>
            <div className="col-lg-7 col-md-9 col-12">
              <Navbar />
            </div>
            <div className="col-lg-2 col-12">
              <div className="get-quote">
                {user ? (
                  <button className="btn" onClick={handleLogout}>
                    Logout
                  </button>
                ) : (
                  <Link href="/appointment" className="btn">
                    Appointment
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
