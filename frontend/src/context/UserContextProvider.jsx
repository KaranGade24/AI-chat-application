import { createContext } from "react";

const UserContext = createContext({
  user: null,
  setUser: () => {},
});

import React from "react";

function UserContextProvider({ children }) {
  const [user, setUser] = React.useState(null);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export default UserContextProvider;
