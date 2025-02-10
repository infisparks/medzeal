"use client";

import React, { useEffect, useState } from 'react';
import { db } from '../../../lib/firebaseConfig';
import { ref, onValue } from 'firebase/database';
import { Bar } from 'react-chartjs-2';
import Chart from 'chart.js/auto';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const AppointmentsGraphPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [dayData, setDayData] = useState([]);
  const [monthData, setMonthData] = useState([]);

  useEffect(() => {
    const appointmentsRef = ref(db, 'appointments');

    onValue(appointmentsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const attendedAppointments = Object.entries(data).flatMap(([key, appointment]) =>
          Object.entries(appointment).map(([id, details]) => ({ ...details, id }))
        ).filter(({ approved, attended }) => approved && attended);

        setAppointments(attendedAppointments);
      } else {
        setAppointments([]);
      }
    });
  }, []);

  useEffect(() => {
    const dayCounts = {};
    const monthCounts = {};

    appointments.forEach(({ appointmentDate }) => {
      const date = appointmentDate.split('T')[0]; // Format YYYY-MM-DD
      const month = appointmentDate.split('-').slice(0, 2).join('-'); // Format YYYY-MM

      // Count appointments by day
      dayCounts[date] = (dayCounts[date] || 0) + 1;

      // Count appointments by month
      monthCounts[month] = (monthCounts[month] || 0) + 1;
    });

    // Prepare data for day-wise graph
    setDayData(Object.entries(dayCounts).map(([date, count]) => ({ date, count })));

    // Prepare data for month-wise graph
    setMonthData(Object.entries(monthCounts).map(([month, count]) => ({ month, count })));
  }, [appointments]);

  // Chart data for day-wise appointments
  const dayChartData = {
    labels: dayData.map(data => data.date),
    datasets: [
      {
        label: 'Appointments Per Day',
        data: dayData.map(data => data.count),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
    ],
  };

  // Chart data for month-wise appointments
  const monthChartData = {
    labels: monthData.map(data => data.month),
    datasets: [
      {
        label: 'Appointments Per Month',
        data: monthData.map(data => data.count),
        backgroundColor: 'rgba(153, 102, 255, 0.6)',
      },
    ],
  };

  const downloadGraph = (type, graph) => {
    const chartContainer = document.getElementById(graph);
    html2canvas(chartContainer).then((canvas) => {
      const imgData = canvas.toDataURL(`image/${type}`);
      if (type === 'pdf') {
        const pdf = new jsPDF();
        pdf.addImage(imgData, 'PNG', 0, 0);
        pdf.save(`${graph}_graph.pdf`);
      } else {
        const link = document.createElement('a');
        link.href = imgData;
        link.download = `${graph}_graph.${type}`;
        link.click();
      }
    });
  };

  return (
    <div className="container mt-5">
      <h1 className="display-4 text-center mb-4">Appointments Graph</h1>

      <div id="dailyChartContainer" className="mb-5 card shadow-sm hover-shadow">
        <div className="card-body">
          <h2>Daily Appointments</h2>
          <Bar data={dayChartData} options={{ responsive: true }} />
        </div>
        <div className="card-footer text-center">
          <h4>Download Daily Graph</h4>
          <button 
            className="btn btn-primary me-2" 
            onClick={() => downloadGraph('pdf', 'dailyChartContainer')}
          >
            Download PDF
          </button>
          <button 
            className="btn btn-secondary me-2" 
            onClick={() => downloadGraph('png', 'dailyChartContainer')}
          >
            Download PNG
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={() => downloadGraph('jpg', 'dailyChartContainer')}
          >
            Download JPG
          </button>
        </div>
      </div>

      <div id="monthlyChartContainer" className="mb-5 card shadow-sm hover-shadow">
        <div className="card-body">
          <h2>Monthly Appointments</h2>
          <Bar data={monthChartData} options={{ responsive: true }} />
        </div>
        <div className="card-footer text-center">
          <h4>Download Monthly Graph</h4>
          <button 
            className="btn btn-primary me-2" 
            onClick={() => downloadGraph('pdf', 'monthlyChartContainer')}
          >
            Download PDF
          </button>
          <button 
            className="btn btn-secondary me-2" 
            onClick={() => downloadGraph('png', 'monthlyChartContainer')}
          >
            Download PNG
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={() => downloadGraph('jpg', 'monthlyChartContainer')}
          >
            Download JPG
          </button>
        </div>
      </div>

      <style jsx>{`
        .container {
          max-width: 800px;
          margin: auto;
        }
        .card {
          border-radius: 10px;
          transition: transform 0.3s;
        }
        .hover-shadow:hover {
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
          transform: scale(1.02);
        }
      `}</style>
    </div>
  );
};

export default AppointmentsGraphPage;
