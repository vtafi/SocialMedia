import React, { useEffect } from "react";
import socket from "./socket";

export default function Chat() {
  const Profile = JSON.parse(localStorage.getItem("profile") || "{}");
  const [message, setMessage] = React.useState("");
  useEffect(() => {
    socket.auth = {
      _id: Profile._id,
    };
    socket.connect();
    return () => {
      socket.disconnect();
    };
  }, []);
  const handleSubmit = (e: any) => {
    e.preventDefault();
    setMessage("");
  };
  return (
    <div>
      <h1>Chat</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          onChange={(e) => setMessage(e.target.value)}
          value={message}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
