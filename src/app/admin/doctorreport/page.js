"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { getDatabase, ref, get } from "firebase/database";
import { app } from '../../../lib/firebaseConfig'; // Adjust the path if necessary
import Header from "@/components/Header/Header"; // Ensure this path is correct
import Breadcrumbs from "@/components/Breadcrumbs"; // Ensure this path is correct
import { Bar } from "react-chartjs-2";
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { FaDownload, FaCalendarAlt, FaUserMd } from "react-icons/fa";

// Register Chart.js components
Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const DoctorDashboard = () => {
  const db = getDatabase(app);

  const [rawAppointments, setRawAppointments] = useState([]);
  const [aggregatedData, setAggregatedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // States for filters
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");

  const dashboardRef = useRef(null); // Reference to the dashboard section for PDF generation

  // Fetch appointments from Firebase and store raw data
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const appointmentsRef = ref(db, 'appointments/test'); // Adjust path if necessary
        const snapshot = await get(appointmentsRef);

        if (!snapshot.exists()) {
          throw new Error("No appointments data available.");
        }

        const appointmentsData = snapshot.val();
        const appointmentsList = Object.values(appointmentsData);

        setRawAppointments(appointmentsList);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching appointments:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [db]);

  // Create a list of distinct years from the appointment dates
  const distinctYears = useMemo(() => {
    const yearsSet = new Set();
    rawAppointments.forEach(appointment => {
      if (appointment.appointmentDate) {
        const [year] = appointment.appointmentDate.split("-");
        yearsSet.add(year);
      }
    });
    return Array.from(yearsSet).sort();
  }, [rawAppointments]);

  // Define months array for the dropdown
  const months = [
    { value: "01", name: "January" },
    { value: "02", name: "February" },
    { value: "03", name: "March" },
    { value: "04", name: "April" },
    { value: "05", name: "May" },
    { value: "06", name: "June" },
    { value: "07", name: "July" },
    { value: "08", name: "August" },
    { value: "09", name: "September" },
    { value: "10", name: "October" },
    { value: "11", name: "November" },
    { value: "12", name: "December" },
  ];

  // Filter and aggregate appointments based on selected year and month
  useEffect(() => {
    let filteredAppointments = rawAppointments;

    if (selectedYear) {
      filteredAppointments = filteredAppointments.filter(appointment => {
        if (!appointment.appointmentDate) return false;
        const [year] = appointment.appointmentDate.split("-");
        return year === selectedYear;
      });
    }

    if (selectedMonth) {
      filteredAppointments = filteredAppointments.filter(appointment => {
        if (!appointment.appointmentDate) return false;
        const [, month] = appointment.appointmentDate.split("-");
        return month === selectedMonth;
      });
    }

    const aggregation = {};

    filteredAppointments.forEach(appointment => {
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

    // Convert the aggregation object to an array for mapping
    const aggregatedArray = Object.keys(aggregation).map(doctorName => ({
      name: doctorName,
      count: aggregation[doctorName].count,
      totalAmount: aggregation[doctorName].totalAmount,
    }));

    setAggregatedData(aggregatedArray);
  }, [rawAppointments, selectedYear, selectedMonth]);

  // Prepare data for Chart.js
  const chartData = {
    labels: aggregatedData.map(doctor => doctor.name),
    datasets: [
      {
        label: 'Total Appointments',
        data: aggregatedData.map(doctor => doctor.count),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
      },
      {
        label: 'Total Amount Collected (rs)',
        data: aggregatedData.map(doctor => doctor.totalAmount),
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            family: 'Arial, sans-serif',
            size: 14,
          },
        },
      },
      title: {
        display: true,
        text: 'Doctor Appointments and Earnings',
        font: {
          family: 'Arial, sans-serif',
          size: 18,
        },
      },
    },
  };

  // Function to generate and download PDF
  const downloadPDF = () => {
    const input = dashboardRef.current;
    if (!input) return;

    html2canvas(input, { scale: 2 })
      .then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'pt', 'a4');

        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save("Doctor_Dashboard_Report.pdf");
      })
      .catch(err => {
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
          <h2>
            <FaUserMd style={{ marginRight: '10px', color: '#3498db' }}/> 
            Doctor Dashboard
          </h2>
          
          {/* Filter Section */}
          <div className="filter-container">
            <div className="filter-item">
              <label htmlFor="yearFilter">
                <FaCalendarAlt style={{ marginRight: '5px', color: '#3498db' }}/> Year:
              </label>
              <select
                id="yearFilter"
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  setSelectedMonth(""); // Reset month when year changes
                }}
              >
                <option value="">All Years</option>
                {distinctYears.map((year, index) => (
                  <option key={index} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-item">
              <label htmlFor="monthFilter">
                <FaCalendarAlt style={{ marginRight: '5px', color: '#3498db' }}/> Month:
              </label>
              <select
                id="monthFilter"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                disabled={!selectedYear}
              >
                <option value="">All Months</option>
                {months.map((month, index) => (
                  <option key={index} value={month.value}>
                    {month.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="chart-container">
            <Bar data={chartData} options={chartOptions} />
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Doctor Name</th>
                  <th>Total Appointments</th>
                  <th>Total Amount Collected (rs)</th>
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
              <FaDownload style={{ marginRight: '8px' }}/> 
              Download Report as PDF
            </button>
          </div>
        </div>
      </section>

      <style jsx>{`
        .doctor-dashboard {
          padding: 40px 20px;
          background: #f9f9f9;
          min-height: 100vh;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
          background: #fff;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        h2 {
          text-align: center;
          margin-bottom: 30px;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: #2c3e50;
        }
        .filter-container {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin-bottom: 30px;
          flex-wrap: wrap;
        }
        .filter-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .filter-item label {
          font-weight: bold;
          color: #2c3e50;
        }
        select {
          padding: 6px 10px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 14px;
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
          font-size: 14px;
        }
        .table th {
          background-color: #ecf0f1;
          color: #2c3e50;
        }
        .table tr:nth-child(even) {
          background-color: #f2f2f2;
        }
        .table tr:hover {
          background-color: #e9e9e9;
        }
        .button-container {
          text-align: center;
          margin-top: 30px;
        }
        .btn {
          background-color: #3498db;
          border: none;
          color: white;
          padding: 12px 24px;
          font-size: 16px;
          cursor: pointer;
          border-radius: 4px;
          display: inline-flex;
          align-items: center;
          transition: background-color 0.3s ease;
        }
        .btn:hover {
          background-color: #2980b9;
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
