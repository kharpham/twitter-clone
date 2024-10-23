import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/home/HomePage";
import LoginPage from "./pages/auth/login/LoginPage";
import SignUpPage from "./pages/auth/signup/SignUpPage";
import Sidebar from "./components/common/SideBar";
import RightPanel from "./components/common/RightPanel";
import NotificationPage from "./pages/notification/NotificationPage";

function App() {
  return (
    <>
      <div className="flex max-w-6xl mx-auto">
        {/* Not wrapped with routes => common component */}
        <Sidebar/> 
        <Routes>
          <Route path="/" element={<HomePage/>}/>
          <Route path="/login" element={<LoginPage/>}/>
          <Route path="/signup" element={<SignUpPage/>}/>
          <Route path="/notifications" element={<NotificationPage/>}/>
        </Routes>
        <RightPanel/>
      </div>
    </>
  )
}

export default App;
