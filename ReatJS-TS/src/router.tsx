import { createBrowserRouter } from "react-router-dom";
import Home from "./Home";
import Login from "./Login";
import Chat from "./Chat";

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
]);

export default router;
