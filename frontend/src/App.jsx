import React from "react";
import { useParams } from "react-router-dom";
import Screen from "./components/mainScreen/Screen";
import "./App.css";
import UserContextProvider from "./context/UserContextProvider";

function App() {
  const { chatId } = useParams();

  return (
    <>
      <UserContextProvider>
        <Screen chatId={chatId} />
      </UserContextProvider>
    </>
  );
}

export default App;
