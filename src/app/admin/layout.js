"use client"; // Ensure this component runs on the client side
import React, { useEffect, useState } from 'react';
import { auth, db } from '../../lib/firebaseConfig'; // Adjust the path as necessary
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { ref, get } from 'firebase/database';

export default function Layout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // If user is not logged in, redirect to the login page
        router.push('/login'); // Change to your login route
        setLoading(false);
        return;
      }

      // Fetch user role from your database
      const userRef = ref(db, `users/${user.uid}`); // Adjust the path as necessary

      try {
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          const userData = snapshot.val();
          console.log('User Data:', userData); // Debug: Log user data

          setUserRole(userData.role);

          // Define access rules for specific routes.
          // For the following routes, only "admin" users are allowed.
          const accessRules = {
            '/admin/dashboard': ['admin'],
            '/admin/staff': ['admin', 'staff'],
            '/admin/appointments': ['admin'],
            '/admin/doctorreport': ['admin'],
            '/admin/graphprice': ['admin'],
            '/admin/graphtotal': ['admin'],
            '/admin/bookedAppoinmentGraph': ['admin'],
            '/admin/creditcycle': ['admin'],
            '/admin/sellpage': ['admin', 'doctor'],
          };

          // Determine if the current path requires specific roles.
          const requiredRoles = accessRules[pathname];

          if (requiredRoles && !requiredRoles.includes(userData.role)) {
            // User does not have permission for this route.
            router.push('/unauthorized'); // Change to your unauthorized route
            return;
          }
        } else {
          // Handle case where user data doesn't exist.
          console.error('User data does not exist.');
          router.push('/unauthorized'); // Change to your unauthorized route
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        router.push('/unauthorized'); // Redirect on error.
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, [router, pathname]);

  // Show a loading state while checking authentication and role.
  if (loading) {
    return <div>Loading...</div>; // You can replace this with a spinner or skeleton loader.
  }

  return (
    <div className="container mt-4">
      {children}
    </div>
  );
}
