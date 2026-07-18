import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "../../App";
import LoginPage from "../Pages/Login";

export const Router = createBrowserRouter([
  { path: "/", element: <Navigate to={"/chat/new"} replace /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/chat/:chatId", element: <App /> },
]);
