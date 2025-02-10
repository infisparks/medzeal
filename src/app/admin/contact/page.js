"use client";
import React, { useEffect, useState } from "react";
import { db } from "../../../lib/firebaseConfig";
import { ref, onValue, update } from "firebase/database";
import Header from "@/components/Header/Header";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function ContactPanel() {
    const [contacts, setContacts] = useState([]);

    useEffect(() => {
      const contactRef = ref(db, "contacts");
      onValue(contactRef, (snapshot) => {
        const data = snapshot.val();
        const contactList = [];
        for (let id in data) {
          contactList.push({ id, ...data[id] });
        }
        // Sort contacts to show unseen messages first
        const sortedContacts = contactList.sort((a, b) => a.seen - b.seen);
        setContacts(sortedContacts);
      });
    }, []);
  
    const handleSeenToggle = (id, currentStatus) => {
      const contactRef = ref(db, `contacts/${id}`);
      update(contactRef, { seen: !currentStatus });
    };
  
    return (
      <>
        <Header />
        <Breadcrumbs title="Admin Panel" menuText="Contact Messages" />
        <div className="container mt-4">
          <h2 className="mb-4">Contact Messages</h2>
          <table className="table table-bordered">
            <thead className="table-light">
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Subject</th>
                <th>Message</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => (
                <tr key={contact.id}>
                  <td>{contact.name}</td>
                  <td>{contact.email}</td>
                  <td>{contact.phone}</td>
                  <td>{contact.subject}</td>
                  <td>{contact.message}</td>
                  <td>
                    <button
                      className={`btn ${contact.seen ? "btn-success" : "btn-warning"}`}
                      onClick={() => handleSeenToggle(contact.id, contact.seen)}
                    >
                      {contact.seen ? "Seen" : "Unseen"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }
  