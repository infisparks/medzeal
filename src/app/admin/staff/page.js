"use client";
import React from 'react';
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookOpen,
  faCheckCircle,
  faHistory,
  faFileInvoice,
  faBoxOpen,
  faCalendarDay,
  faPlusCircle,
} from "@fortawesome/free-solid-svg-icons";

const AdminDashboard = () => {
  return (
    <div className="container-fluid p-4 admin-dashboard">
      {/* Header Section */}
      <header className="mb-5 text-center">
        <h1 className="display-4 fw-bold text-primary mb-3">Staff Dashboard</h1>
      </header>

      {/* Main Content */}
      <div className="row g-4">
        {[
          { title: "Book Appointment", icon: faBookOpen, link: "/admin/directbooking", color: "primary" },
          { title: "ADD Amount", icon: faBoxOpen, link: "/admin/approval", color: "danger" },
          { title: "Online Appointments", icon: faCheckCircle, link: "/admin/onlinebooking", color: "success" },
          { title: "Today Appointments", icon: faCalendarDay, link: "/admin/todayattend", color: "info" },
          { title: "User History", icon: faHistory, link: "/admin/userhistory", color: "dark" },
          { title: "Download Invoice", icon: faFileInvoice, link: "/admin/invoice", color: "secondary" },
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