"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { db } from "../../../lib/firebaseConfig";
import { ref, onValue, off } from "firebase/database";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarPlus,
  faBookOpen,
  faCheckCircle,
  faUserCheck,
  faHistory,
  faFileInvoice,
  faBoxOpen,
  faCalendarDay,
  faPlusCircle,
  faStore,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";

const AdminDashboard = () => {
  const [todayAppointmentsCount, setTodayAppointmentsCount] = useState(0);

  useEffect(() => {
    const appointmentsRef = ref(db, "appointments");
    const fetchAppointments = (snapshot) => {
      const appointments = snapshot.val();
      const today = new Date().toISOString().split("T")[0];
      if (appointments) {
        const allAppointments = Object.entries(appointments).flatMap(
          ([key, appointment]) =>
            Object.entries(appointment).map(([id, details]) => details)
        );
        const todayAppointments = allAppointments.filter(
          (appointment) => appointment.appointmentDate === today
        ).length;
        setTodayAppointmentsCount(todayAppointments);
      }
    };
    onValue(appointmentsRef, fetchAppointments);
    return () => off(appointmentsRef, fetchAppointments);
  }, []);

  return (
    <div className="container-fluid p-4 admin-dashboard">
      {/* Header Section */}
      <header className="mb-5 text-center">
        <h1 className="display-4 fw-bold text-primary mb-3">Staff Dashboard</h1>
        <div className="dashboard-summary d-flex justify-content-center gap-4">
          <div className="summary-card bg-success text-white p-4 rounded-3 shadow-lg">
            <h5 className="mb-2">Todays Appointments</h5>
            <div className="display-4 fw-bold">{todayAppointmentsCount}</div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="row g-4">
        {[
          { title: "Book Appointment", icon: faBookOpen, link: "/admin/directbooking", color: "primary" },
          { title: "Approved Appointments", icon: faCheckCircle, link: "/admin/approval", color: "success" },
          { title: "Mark User Present", icon: faUserCheck, link: "/admin/attend", color: "warning" },
          { title: "Today Appointments", icon: faCalendarDay, link: "/admin/todayattend", color: "info" },
          { title: "User History", icon: faHistory, link: "/admin/userhistory", color: "dark" },
          { title: "Sell Product", icon: faBoxOpen, link: "/admin/inventrysell", color: "danger" },
          { title: "Download Invoice", icon: faFileInvoice, link: "/admin/invoice", color: "secondary" },
          { title: "Add Vendor", icon: faStore, link: "/admin/vendorentry", color: "dark" },
          { title: "All Vendors & Add Products", icon: faUsers, link: "/admin/vendors", color: "success" },
        ].map((item, index) => (
          <div key={index} className="col-xxl-3 col-lg-4 col-md-6">
            <Link href={item.link} className="text-decoration-none">
              <div
                className={`card h-100 shadow-lg border-0 hover-effect bg-${item.color}-subtle`}
                style={{ transition: "transform 0.3s ease" }}
              >
                <div className="card-body d-flex flex-column justify-content-between">
                  <div className="d-flex align-items-center mb-3">
                    <div
                      className={`icon-wrapper bg-${item.color} p-3 rounded-circle me-3`}
                      style={{ transition: "transform 0.3s ease" }}
                    >
                      <FontAwesomeIcon icon={item.icon} className="fa-2x text-white" />
                    </div>
                    <h5 className="card-title mb-0 fw-bold text-dark">{item.title}</h5>
                  </div>
                  <div className={`btn btn-${item.color} w-100 hover-darken`}>
                    Open {item.title}
                    <FontAwesomeIcon icon={faPlusCircle} className="ms-2" />
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Global Styles */}
      <style jsx global>{`
        .admin-dashboard {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          min-height: 100vh;
        }
        .hover-effect:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
        }
        .icon-wrapper {
          transition: transform 0.3s ease;
        }
        .card:hover .icon-wrapper {
          transform: scale(1.1);
        }
        .btn.hover-darken:hover {
          filter: brightness(90%);
        }
        .bg-primary-subtle {
          background-color: #e3f2fd !important;
        }
        .bg-success-subtle {
          background-color: #d4edda !important;
        }
        .bg-warning-subtle {
          background-color: #fff3cd !important;
        }
        .bg-info-subtle {
          background-color: #d1ecf1 !important;
        }
        .bg-danger-subtle {
          background-color: #f8d7da !important;
        }
        .bg-secondary-subtle {
          background-color: #e2e3e5 !important;
        }
        .bg-purple-subtle {
          background-color: #ede7f6 !important;
        }
        .bg-indigo-subtle {
          background-color: #e8eaf6 !important;
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;