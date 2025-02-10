"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <>
      <div className="main-menu">
        <nav className="navigation">
          <ul className="nav menu">
            <li>
              <Link href="/">
                Home 
              </Link>
              
            </li>
            <li>
              <Link href="/doctors">
                Doctor
              </Link>
              
            </li>

            <li>
              <Link href="/service">
                service
              </Link>
              
            </li>
            <li>
              
              <Link
                className={` ${pathname === "/contact" ? "active" : ""}`}
                href="/time-table"
              >
                Time Table
              </Link>
            </li>
            <li>
              <Link href="/blog-grid">
                Blog
              </Link>
              
            </li>
            <li>
              <Link href="/gallery">
                Gallery
              </Link>
              
            </li>
               
          
            <li>
              <Link
                className={` ${pathname === "/contact" ? "active" : ""}`}
                href="/contact"
              >
                Contact Us
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </>
  );
}
