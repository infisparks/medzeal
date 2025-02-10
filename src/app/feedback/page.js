"use client"; // Ensure this is a client component
import React, { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { ref, set, get } from 'firebase/database';
import { db, auth } from '../../lib/firebaseConfig'; // Adjust the import path accordingly
import { onAuthStateChanged } from 'firebase/auth';
import { useSearchParams } from 'next/navigation'; // Import useSearchParams

const FeedbackContent = () => {
  const searchParams = useSearchParams(); // Get search params from URL
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0); // State for hover effect
  const [comment, setComment] = useState('');
  const [userId, setUserId] = useState(null); // State for user ID
  const [doctorId, setDoctorId] = useState(null); // State for doctor ID
  const [error, setError] = useState(''); // State for error messages
  const [showLoginModal, setShowLoginModal] = useState(false); // State for login modal visibility

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid); // Set user ID if user is logged in
        console.log("User ID set:", user.uid); // Log user ID for debugging
      } else {
        setUserId(null); // User is logged out
        console.log("No user is logged in."); // Log if no user
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Get doctor ID from search params
    const uid = searchParams.get('uid');
    console.log("Search Params:", searchParams.toString()); // Log search params for debugging
    if (uid) {
      setDoctorId(uid); // Set doctor ID from search params
      console.log("Doctor ID from query set:", uid); // Log doctor ID for debugging
    } else {
      console.log("No doctor ID in query."); // Log if no doctor ID
    }
  }, [searchParams]); // Add searchParams as a dependency

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("User ID on submit:", userId); // Log user ID on submit
    console.log("Doctor ID on submit:", doctorId); // Log doctor ID on submit

    // Check if userId is available before proceeding
    if (!userId) {
      setShowLoginModal(true); // Show login modal if user is not logged in
      return;
    }

    // Check if doctorId is available before proceeding
    if (!doctorId) {
      setError('Doctor ID is missing'); // Specific error message for doctor ID
      console.error("Doctor ID is missing."); // Log the specific error
      return;
    }

    const userFeedbackRef = ref(db, `feedback/${userId}/${doctorId}`);
    try {
      // Check if the user has already rated the doctor
      const snapshot = await get(userFeedbackRef);
      if (snapshot.exists()) {
        alert('You have already submitted feedback for this doctor.');
        return;
      }

      // Save feedback to the database
      await set(userFeedbackRef, {
        rating,
        comment,
      });

      alert('Feedback submitted successfully!');
      // Reset form
      setRating(0);
      setComment('');
      setError(''); // Clear error message
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setError('An error occurred while submitting your feedback. Please try again.');
    }
  };

  // Function to handle login redirect
  const handleLoginRedirect = () => {
    setShowLoginModal(false); // Close the modal
    router.push('/login'); // Redirect to login page
  };

  return (
    <div className="feedback-form" style={styles.container}>
      <h2 style={styles.header}>Feedback for Doctor</h2>
      {error && <p style={styles.error}>{error}</p>}
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label htmlFor="rating" style={styles.label}>Rating:</label>
          <div style={styles.starRating}>
            {[...Array(5)].map((_, index) => (
              <span
                key={index}
                style={{
                  ...styles.star,
                  color: (hoveredRating || rating) > index ? '#FFD700' : '#ccc', // Gold for selected, light gray for unselected
                }}
                onClick={() => setRating(index + 1)} // Set rating on click
                onMouseEnter={() => setHoveredRating(index + 1)} // Highlight on hover
                onMouseLeave={() => setHoveredRating(0)} // Reset highlight
              >
                ★
              </span>
            ))}
          </div>
        </div>
        <div style={styles.formGroup}>
          <label htmlFor="comment" style={styles.label}>Comment:</label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            required
            style={styles.textarea}
          />
        </div>
        <button type="submit" style={styles.button}>Submit Feedback</button>
      </form>

      {/* Login Modal */}
      {showLoginModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3>Please Log In</h3>
            <p>You must be logged in to submit feedback.</p>
            <button onClick={handleLoginRedirect} style={styles.modalButton}>Login</button>
            <button onClick={() => setShowLoginModal(false)} style={styles.modalButton}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

// Styles for the Feedback Form
const styles = {
  container: {
    maxWidth: '600px',
    margin: '20px auto',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
    backgroundColor: '#fff',
    fontFamily: 'Arial, sans-serif',
  },
  header: {
    textAlign: 'center',
    marginBottom: '20px',
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginBottom: '15px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  formGroup: {
    marginBottom: '15px',
  },
  label: {
    marginBottom: '5px',
    fontWeight: 'bold',
  },
  starRating: {
    display: 'flex',
    cursor: 'pointer',
  },
  star: {
    fontSize: '24px',
    marginRight: '5px',
  },
  textarea: {
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    width: '100%',
    height: '100px',
    resize: 'none',
  },
  button: {
    padding: '10px',
    backgroundColor: '#0070f3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'background-color 0.3s',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000, // Ensure it is above other content
  },
  modalContent: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    textAlign: 'center',
  },
  modalButton: {
    padding: '10px',
    backgroundColor: '#0070f3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    margin: '10px',
  },
};


// Wrap the main component in a Suspense boundary
const Feedback = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <FeedbackContent />
  </Suspense>
);

export default Feedback;
