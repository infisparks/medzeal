import { ref, get, child } from "firebase/database";
import { db } from "../../lib/firebaseConfig";

// Fetch doctor details from Firebase for SEO metadata
async function fetchDoctorDetails(uid) {
  try {
    const dbRef = ref(db);
    const snapshot = await get(child(dbRef, `doctors/${uid}`));
    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching doctor details for SEO: ", error);
    return null;
  }
}

// Function to dynamically generate metadata
export async function generateMetadata({ searchParams }) {
  const uid = searchParams?.get("uid"); // Ensure searchParams is available
  if (uid) {
    const doctor = await fetchDoctorDetails(uid);
    if (doctor) {
      return {
        title: `${doctor.name} - ${doctor.role} | Medzeal Mumbra`,
        description: `${doctor.name} is a highly qualified ${doctor.role} with a specialization in ${doctor.specialization || doctor.role}. Book an appointment today at Medzeal Mumbra.`,
        keywords: `${doctor.name}, ${doctor.role}, ${doctor.specialization}, Medzeal doctors, Mumbra physiotherapists, wellness center experts`,
      };
    }
  }
  // Fallback metadata if no doctor found
  return {
    title: "Doctor Details | Medzeal Mumbra",
    description: "Meet our expert doctors at Medzeal Mumbra. Book an appointment today.",
    keywords: "doctors, physiotherapy, wellness center, Medzeal Mumbra",
  };
}

export default function DoctorDetailsLayout({ children }) {
  return <>{children}</>;
}
