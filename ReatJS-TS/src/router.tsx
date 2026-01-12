import { createBrowserRouter } from "react-router";
import Home from "./Home";
import Login from "./Login";
import Chat from "./Chat";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/login/oauth",
    element: <Login />,
  },
  {
    path: "/chat",
    element: <Chat />,
  },
]);

export default router;
