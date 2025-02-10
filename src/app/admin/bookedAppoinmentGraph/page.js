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

const MostBookedAppointmentsGraphPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [mostBookedData, setMostBookedData] = useState([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [loading, setLoading] = useState(true);

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
    const serviceCounts = {};

    appointments.forEach(({ subCategory }) => {
      const service = subCategory || 'Uncategorized';
      serviceCounts[service] = (serviceCounts[service] || 0) + 1;
    });

    // Convert counts to array and sort descending
    const sortedMostBookedData = Object.entries(serviceCounts)
      .map(([service, count]) => ({ service, count }))
      .sort((a, b) => b.count - a.count); // Descending order

    setMostBookedData(sortedMostBookedData);
  }, [appointments]);

  const mostBookedChartData = {
    labels: mostBookedData.map(data => data.service),
    datasets: [
      {
        label: 'Number of Appointments',
        data: mostBookedData.map(data => data.count),
        backgroundColor: 'rgba(153, 102, 255, 0.6)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1,
      },
    ],
  };

  const downloadGraph = (type, graphId) => {
    setIsDownloading(true);
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
      setIsDownloading(false);
    }).catch((error) => {
      console.error('Error downloading graph:', error);
      alert('Failed to download the graph. Please try again.');
      setIsDownloading(false);
    });
  };

  return (
    <div className="container mt-5">
      <h1 className="display-4 text-center mb-4">Most Booked Appointments</h1>

      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading appointments...</p>
        </div>
      ) : (
        <>
          {/* Total Booked Services Display */}
          <div className="mb-4 text-center">
            <h3>Total Booked Services: <span className="text-primary">{mostBookedData.reduce((acc, curr) => acc + curr.count, 0)}</span></h3>
          </div>

          {/* Most Booked Appointments Chart */}
          <div id="mostBookedAppointmentsChart" className="card mb-5 shadow-sm">
            <div className="card-body">
              <h2 className="card-title">Appointments by Service</h2>
              {mostBookedData.length > 0 ? (
                <Bar 
                  data={mostBookedChartData} 
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                      title: {
                        display: false,
                        text: 'Most Booked Services',
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          stepSize: 1,
                        },
                      },
                    },
                  }} 
                />
              ) : (
                <p className="text-muted">No booked services data available.</p>
              )}
            </div>
            {!isDownloading && (
              <div className="card-footer text-center">
                <h4>Download Most Booked Appointments Graph</h4>
                <Button 
                  variant="primary" 
                  className="me-2 mb-2" 
                  onClick={() => downloadGraph('pdf', 'mostBookedAppointmentsChart')}
                >
                  <FaFileExport className="me-2" />
                  Download PDF
                </Button>
                <Button 
                  variant="secondary" 
                  className="me-2 mb-2" 
                  onClick={() => downloadGraph('png', 'mostBookedAppointmentsChart')}
                >
                  Download PNG
                </Button>
                <Button 
                  variant="secondary" 
                  className="mb-2" 
                  onClick={() => downloadGraph('jpg', 'mostBookedAppointmentsChart')}
                >
                  Download JPG
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Scoped Styles */}
      <style jsx>{`
        .container {
          max-width: 1000px;
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
        .btn-primary, .btn-secondary {
          width: 150px;
        }
      `}</style>
    </div>
  );
};

export default MostBookedAppointmentsGraphPage;
