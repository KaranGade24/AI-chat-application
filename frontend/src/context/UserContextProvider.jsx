import { createContext } from "react";

export const UserContext = createContext({
  user: null,
  setUser: () => {},
});

import React from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function UserContextProvider({ children }) {
  const [user, setUser] = React.useState(null);
  const navigate = useNavigate();
  const loadUser = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "/api/";
      const response = await fetch(`${apiUrl}users/me`, {
        method: "GET",
        credentials: "include",
      });
      if (!response.ok) {
        console.error("Failed to fetch user data:", response.status);
        navigate("/login");
        return;
      }
      const result = await response.json();
      console.log(result);
      setUser(result);
    } catch (err) {
      console.error("Error in fetching user data:", err);
      navigate("/login");
    }
  };

  useEffect(() => {
    loadUser();
  }, []);
  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export default UserContextProvider;
