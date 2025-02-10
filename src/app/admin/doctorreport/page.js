// app/doctor-dashboard/page.js

"use client";

import { useEffect, useState, useRef } from "react";
import { getDatabase, ref, get } from "firebase/database";
import { app } from '../../../lib/firebaseConfig'; // Adjust the path if necessary
import Header from "@/components/Header/Header"; // Ensure this path is correct
import Breadcrumbs from "@/components/Breadcrumbs"; // Ensure this path is correct
import { Bar } from "react-chartjs-2";
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// Register Chart.js components
Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const DoctorDashboard = () => {
  const db = getDatabase(app);

  const [aggregatedData, setAggregatedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const dashboardRef = useRef(null); // Reference to the dashboard section for PDF generation

  useEffect(() => {
    // Fetch appointments and aggregate data
    const fetchAppointments = async () => {
      try {
        const appointmentsRef = ref(db, 'appointments/test'); // Adjust path if necessary
        const snapshot = await get(appointmentsRef);

        if (!snapshot.exists()) {
          throw new Error("No appointments data available.");
        }

        const appointmentsData = snapshot.val();
        const appointmentsList = Object.values(appointmentsData);

        // Aggregate data per doctor
        const aggregation = {};

        appointmentsList.forEach(appointment => {
          const doctorName = appointment.doctor;
          let price = appointment.price;

          // Ensure price is a number
          if (typeof price === "string") {
            price = parseFloat(price) || 0;
          } else {
            price = Number(price) || 0;
          }

          if (aggregation[doctorName]) {
            aggregation[doctorName].count += 1;
            aggregation[doctorName].totalAmount += price;
          } else {
            aggregation[doctorName] = {
              count: 1,
              totalAmount: price,
            };
          }
        });

        // Convert aggregation object to array for easier mapping
        const aggregatedArray = Object.keys(aggregation).map(doctorName => ({
          name: doctorName,
          count: aggregation[doctorName].count,
          totalAmount: aggregation[doctorName].totalAmount,
        }));

        setAggregatedData(aggregatedArray);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching appointments:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [db]);

  // Prepare data for Chart.js
  const chartData = {
    labels: aggregatedData.map(doctor => doctor.name),
    datasets: [
      {
        label: 'Total Appointments',
        data: aggregatedData.map(doctor => doctor.count),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
      {
        label: 'Total Amount Collected (rs)',
        data: aggregatedData.map(doctor => doctor.totalAmount),
        backgroundColor: 'rgba(153, 102, 255, 0.6)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Doctor Appointments and Earnings',
      },
    },
  };

  // Function to generate and download PDF
  const downloadPDF = () => {
    const input = dashboardRef.current;
    if (!input) return;

    html2canvas(input, { scale: 2 }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'pt', 'a4');

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save("Doctor_Dashboard_Report.pdf");
    }).catch(err => {
      console.error("Error generating PDF:", err);
      alert("Failed to generate PDF. Please try again.");
    });
  };

  if (loading) {
    return (
      <>
        <Header />
        <Breadcrumbs title="Doctor Dashboard" menuText="Dashboard" />
        <section className="doctor-dashboard">
          <div className="container">
            <p>Loading...</p>
          </div>
        </section>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <Breadcrumbs title="Doctor Dashboard" menuText="Dashboard" />
        <section className="doctor-dashboard">
          <div className="container">
            <p>Error: {error}</p>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <Header />
      <Breadcrumbs title="Doctor Dashboard" menuText="Dashboard" />

      <section className="doctor-dashboard" ref={dashboardRef}>
        <div className="container">
          <h2>Doctor Dashboard</h2>
          <div className="chart-container">
            <Bar data={chartData} options={chartOptions} />
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Doctor Name</th>
                  <th>Total Appointments</th>
                  <th>Total Amount Collected(rs)</th>
                </tr>
              </thead>
              
              <tbody>
                {aggregatedData.map((doctor, index) => (
                  <tr key={index}>
                    <td>{doctor.name}</td>
                    <td>{doctor.count}</td>
                    <td>{doctor.totalAmount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="button-container">
            <button className="btn" onClick={downloadPDF}>
              Download Report as PDF
            </button>
          </div>
        </div>
      </section>

      <style jsx>{`
        .doctor-dashboard {
          padding: 20px;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
        }
        h2 {
          text-align: center;
          margin-bottom: 20px;
        }
        .chart-container {
          margin-bottom: 40px;
        }
        .table-container {
          overflow-x: auto;
        }
        .table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        .table th,
        .table td {
          border: 1px solid #ddd;
          padding: 12px;
          text-align: left;
        }
        .table th {
          background-color: #f4f4f4;
        }
        .table tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .table tr:hover {
          background-color: #f1f1f1;
        }
        .button-container {
          text-align: center;
          margin-top: 30px;
        }
        .btn {
          background-color: #4CAF50; /* Green */
          border: none;
          color: white;
          padding: 12px 24px;
          text-align: center;
          text-decoration: none;
          display: inline-block;
          font-size: 16px;
          cursor: pointer;
          border-radius: 4px;
        }
        .btn:hover {
          background-color: #45a049;
        }
        @media (max-width: 768px) {
          .table th,
          .table td {
            padding: 8px;
          }
          .btn {
            width: 100%;
            padding: 10px;
          }
        }
      `}</style>
    </>
  );
};

export default DoctorDashboard;
