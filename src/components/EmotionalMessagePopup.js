"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function EmotionalMessagePopup() {
  const messages = [
    "Feeling a bit off? Medzeal Mumbra is here to lift you up – book your appointment now!",
    "Don't let pain drive you crazy – hop on board with Medzeal and ride to recovery!",
    "Why wait in traffic when our experts can speed up your healing? Book today!",
    "Your health is your ride – shift gears with a quick appointment at Medzeal!",
    "No detours on the road to wellness – Medzeal Mumbra is your express lane!",
    "Need a lift? Let Medzeal take you from ouch to outstanding – book now!",
    "Skip the wait; our experts are ready to fast-track your recovery. Book your slot!",
    "Your journey to wellness is just a click away – Medzeal Mumbra awaits!"
  ];
  
  const router = useRouter();
  const [currentMessage, setCurrentMessage] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Set an initial random message
    setCurrentMessage(messages[Math.floor(Math.random() * messages.length)]);
    
    // Determine if the user is on mobile based on window width
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    // Update message randomly every 10 seconds
    const interval = setInterval(() => {
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      setCurrentMessage(randomMessage);
    }, 4000);

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const popupStyle = isMobile
    ? {
        position: "fixed",
        bottom: "0",
        left: "0",
        width: "100%",
        background: "rgba(0,0,0,0.8)",
        color: "#fff",
        padding: "20px",
        borderRadius: "0",
        zIndex: 1000,
        fontSize: "1rem",
        textAlign: "center",
        boxShadow: "0 -4px 8px rgba(0,0,0,0.3)"
      }
    : {
        position: "fixed",
        bottom: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        background: "rgba(0,0,0,0.8)",
        color: "#fff",
        padding: "20px",
        borderRadius: "8px",
        zIndex: 1000,
        maxWidth: "400px",
        fontSize: "1rem",
        textAlign: "center",
        boxShadow: "0 4px 8px rgba(0,0,0,0.3)"
      };

  const buttonStyle = {
    marginTop: "15px",
    padding: "10px 20px",
    background: "#0070f3",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer"
  };

  const handleBookAppointment = () => {
    router.push("/appointment");
  };

  return (
    <div style={popupStyle}>
      <div>{currentMessage}</div>
      <button style={buttonStyle} onClick={handleBookAppointment}>
        Book Appointment
      </button>

    
    </div>
  );
}
