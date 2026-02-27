import { createBrowserRouter } from "react-router-dom";
import Home from "./Home";
import Login from "./pages/Login/Login";
import Chat from "./Chat";
import Register from "./pages/Register/Register";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/chat",
    element: <Chat />,
  },
  {
    path: " ",
    element: <Register />,
  },
]);

export default router;
