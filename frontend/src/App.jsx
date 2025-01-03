import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "./pages/home/HomePage";
import LoginPage from "./pages/auth/login/LoginPage";
import SignUpPage from "./pages/auth/signup/SignUpPage";
import SideBar from "./components/common/SideBar";
import RightPanel from "./components/common/RightPanel";
import NotificationPage from "./pages/notification/NotificationPage";
import ProfilePage from "./pages/profile/ProfilePage";
import { useQuery } from "@tanstack/react-query";
import LoadingSpinner from "./components/common/LoadingSpinner";

function App() {
  const {data:authUser, isLoading} = useQuery({
    queryKey: ['authUser'],
    queryFn: async () => {
      try {
        const res = await fetch("/api/auth/me");
        const authUser = await res.json();
        if (authUser.error) return null;
        if (!res.ok) {
          throw new Error("Something went wrong");
        }
        console.log(authUser);
        return authUser;
      } catch (error) {
        throw new Error(error.message);
      }
    },
    retry: false,
    refetchOnWindowFocus: false
  });
  if (isLoading) {
    return (
      <div className="h-screen flex justify-center items-center">
        <LoadingSpinner size="lg"/>
      </div>
    )
  }

  return (
    <>
      <div className="flex max-w-6xl mx-auto">
        {/* Not wrapped with routes => common component */}
        {authUser && <SideBar/> }
        <Routes>
          <Route path="/" element={authUser ? <HomePage/> : <Navigate to="/login"/>}/>
          <Route path="/login" element={!authUser ? <LoginPage/> : <Navigate to="/"/>}/>
          <Route path="/signup" element={!authUser ? <SignUpPage/> : <Navigate to="/"/>}/>
          <Route path="/notifications" element={authUser ? <NotificationPage/>: <Navigate to="/login"/>}/>
          <Route path="/profile/:username" element={authUser ? <ProfilePage/> : <Navigate to="/login"/> }/>            
        </Routes>
        {authUser && <RightPanel/>}
      </div>
    </>
  )
}

export default App;
