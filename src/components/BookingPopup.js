"use client";
import { useRouter } from "next/navigation";

export default function BookingPopup({ onClose }) {
  const router = useRouter();

  const handleBookNow = () => {
    onClose(); 
    router.push("/appointment"); // Adjust the route as needed
  };

  return (
    <div className="booking-popup-overlay">
      <div className="booking-popup">
        <button onClick={onClose} className="close-btn">&times;</button>
        <h2>Book Your Appointment</h2>
        <p>
          Ready to take the next step? Book your appointment now for professional care and support.
        </p>
        <button onClick={handleBookNow} className="book-btn">Book Now</button>
      </div>
      <style jsx>{`
        .booking-popup-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        .booking-popup {
          background: #fff;
          padding: 2rem;
          border-radius: 8px;
          max-width: 400px;
          width: 90%;
          text-align: center;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
          position: relative;
        }
        .close-btn {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          background: transparent;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
        }
        .book-btn {
          background: #0070f3;
          color: #fff;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
          margin-top: 1rem;
        }
        .book-btn:hover {
          background: #005bb5;
        }
      `}</style>
    </div>
  );
}
