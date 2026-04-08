import { Navigate, Route, Routes } from "react-router-dom"

import CustomCursor from "@/components/CustomCursor"
import DashboardPage from "@/pages/DashboardPage"
import LandingPage from "@/pages/LandingPage"
import SignInPage from "@/pages/SignInPage"

function App() {
  return (
    <>
      <CustomCursor />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default App
