"use client";

import React, { useEffect, useState } from 'react';
import { db } from '../../../lib/firebaseConfig';
import { ref, onValue, off } from 'firebase/database';
import { Bar } from 'react-chartjs-2';
import Chart from 'chart.js/auto';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Button, Spinner } from 'react-bootstrap';
import { FaFileExport } from 'react-icons/fa';

const AppointmentsEarningsGraphPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [dayData, setDayData] = useState([]);
  const [monthData, setMonthData] = useState([]);
  const [isDownloading, setIsDownloading] = useState(false); // Track download state
  const [loading, setLoading] = useState(true); // Track data loading

  // Helper function to convert time to a sortable format
  const convertToSortableDate = (date, time) => {
    // Combine date and time into a Date object
    const [timePart, modifier] = time.split(' ');
    let [hours, minutes] = timePart.split(':').map(Number);

    if (modifier === 'PM' && hours !== 12) {
      hours += 12;
    }
    if (modifier === 'AM' && hours === 12) {
      hours = 0;
    }

    return new Date(`${date}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`);
  };

  useEffect(() => {
    const appointmentsRef = ref(db, 'appointments');

    const handleAppointments = (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setAppointments([]);
        setLoading(false);
        return;
      }

      const attendedAppointments = [];

      Object.entries(data).forEach(([userId, userAppointments]) => {
        Object.entries(userAppointments).forEach(([id, details]) => {
          if (details.approved === true && details.attended === true) {
            attendedAppointments.push({ ...details, id, userId });
          }
        });
      });

      // Sort appointments by date and time descending (latest first)
      attendedAppointments.sort((a, b) => {
        const dateA = convertToSortableDate(a.appointmentDate, a.appointmentTime);
        const dateB = convertToSortableDate(b.appointmentDate, b.appointmentTime);
        return dateB - dateA; // Descending order
      });

      setAppointments(attendedAppointments);
      setLoading(false);
    };

    onValue(appointmentsRef, handleAppointments);

    // Cleanup Listener on Unmount
    return () => {
      off(appointmentsRef, 'value', handleAppointments);
    };
  }, []);

  useEffect(() => {
    const dayEarningsMap = {};
    const monthEarningsMap = {};

    appointments.forEach(({ appointmentDate, price }) => {
      if (!appointmentDate || price === undefined || price === null) return;

      // Ensure price is a number
      const numericPrice = parseFloat(price);
      if (isNaN(numericPrice)) return;

      // Sum earnings per day
      if (dayEarningsMap[appointmentDate]) {
        dayEarningsMap[appointmentDate] += numericPrice;
      } else {
        dayEarningsMap[appointmentDate] = numericPrice;
      }

      // Extract month in 'YYYY-MM' format
      const month = appointmentDate.slice(0, 7); // 'YYYY-MM'
      if (monthEarningsMap[month]) {
        monthEarningsMap[month] += numericPrice;
      } else {
        monthEarningsMap[month] = numericPrice;
      }
    });

    // Convert maps to sorted arrays
    const sortedDayData = Object.entries(dayEarningsMap)
      .map(([date, totalPrice]) => ({ date, totalPrice }))
      .sort((a, b) => new Date(b.date) - new Date(a.date)); // Latest first

    const sortedMonthData = Object.entries(monthEarningsMap)
      .map(([month, totalPrice]) => ({ month, totalPrice }))
      .sort((a, b) => new Date(`${b.month}-01`) - new Date(`${a.month}-01`)); // Latest first

    setDayData(sortedDayData);
    setMonthData(sortedMonthData);
  }, [appointments]);

  const dayEarningsChartData = {
    labels: dayData.map(data => data.date),
    datasets: [
      {
        label: 'Total Earnings Per Day (RS)',
        data: dayData.map(data => data.totalPrice),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const monthEarningsChartData = {
    labels: monthData.map(data => data.month),
    datasets: [
      {
        label: 'Total Earnings Per Month (RS)',
        data: monthData.map(data => data.totalPrice),
        backgroundColor: 'rgba(255, 159, 64, 0.6)',
        borderColor: 'rgba(255, 159, 64, 1)',
        borderWidth: 1,
      },
    ],
  };

  const downloadGraph = (type, graphId) => {
    setIsDownloading(true); // Set downloading state to true
    const chartContainer = document.getElementById(graphId);
    if (!chartContainer) {
      alert('Graph container not found!');
      setIsDownloading(false);
      return;
    }

    html2canvas(chartContainer).then((canvas) => {
      const imgData = canvas.toDataURL(`image/${type}`);
      if (type === 'pdf') {
        const pdf = new jsPDF();
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${graphId}_graph.pdf`);
      } else {
        const link = document.createElement('a');
        link.href = imgData;
        link.download = `${graphId}_graph.${type}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      setIsDownloading(false); // Reset downloading state
    }).catch((error) => {
      console.error('Error downloading graph:', error);
      alert('Failed to download the graph. Please try again.');
      setIsDownloading(false);
    });
  };

  return (
    <div className="container mt-5">
      <h1 className="display-4 text-center mb-4">Earnings Overview</h1>

      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading appointments...</p>
        </div>
      ) : (
        <>
          {/* Total Earnings Display */}
          <div className="mb-4 text-center">
            {/* <h3>Total Earnings Today: <span className="text-primary">RS {dayData.reduce((acc, curr) => acc + curr.totalPrice, 0).toFixed(2)}</span></h3> */}
            <h3>Total Earnings This Month: <span className="text-success">RS {monthData.reduce((acc, curr) => acc + curr.totalPrice, 0).toFixed(2)}</span></h3>
          </div>

          {/* Daily Earnings Chart */}
          <div id="dailyEarningsChart" className="card mb-5 shadow-sm">
            <div className="card-body">
              <h2 className="card-title">Daily Earnings</h2>
              {dayData.length > 0 ? (
                <Bar 
                  data={dayEarningsChartData} 
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                      title: {
                        display: false,
                        text: 'Daily Earnings',
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                      },
                    },
                  }} 
                />
              ) : (
                <p className="text-muted">No earnings data available for today.</p>
              )}
            </div>
            {!isDownloading && (
              <div className="card-footer text-center">
                <h4>Download Daily Earnings Graph</h4>
                <Button 
                  variant="primary" 
                  className="me-2" 
                  onClick={() => downloadGraph('pdf', 'dailyEarningsChart')}
                >
                  <FaFileExport className="me-2" />
                  Download PDF
                </Button>
                <Button 
                  variant="secondary" 
                  className="me-2" 
                  onClick={() => downloadGraph('png', 'dailyEarningsChart')}
                >
                  Download PNG
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => downloadGraph('jpg', 'dailyEarningsChart')}
                >
                  Download JPG
                </Button>
              </div>
            )}
          </div>

          {/* Monthly Earnings Chart */}
          <div id="monthlyEarningsChart" className="card mb-5 shadow-sm">
            <div className="card-body">
              <h2 className="card-title">Monthly Earnings</h2>
              {monthData.length > 0 ? (
                <Bar 
                  data={monthEarningsChartData} 
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                      title: {
                        display: false,
                        text: 'Monthly Earnings',
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                      },
                    },
                  }} 
                />
              ) : (
                <p className="text-muted">No earnings data available for this month.</p>
              )}
            </div>
            {!isDownloading && (
              <div className="card-footer text-center">
                <h4>Download Monthly Earnings Graph</h4>
                <Button 
                  variant="primary" 
                  className="me-2" 
                  onClick={() => downloadGraph('pdf', 'monthlyEarningsChart')}
                >
                  <FaFileExport className="me-2" />
                  Download PDF
                </Button>
                <Button 
                  variant="secondary" 
                  className="me-2" 
                  onClick={() => downloadGraph('png', 'monthlyEarningsChart')}
                >
                  Download PNG
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => downloadGraph('jpg', 'monthlyEarningsChart')}
                >
                  Download JPG
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      <style jsx>{`
        .container {
          max-width: 1200px;
        }
        .card {
          border-radius: 10px;
        }
        .card-title {
          display: flex;
          align-items: center;
          font-size: 1.5rem;
          margin-bottom: 1rem;
        }
        @media (max-width: 768px) {
          .display-4 {
            font-size: 2rem;
          }
          .card-title {
            font-size: 1.25rem;
          }
        }
      `}</style>
    </div>
  );
};

export default AppointmentsEarningsGraphPage;
