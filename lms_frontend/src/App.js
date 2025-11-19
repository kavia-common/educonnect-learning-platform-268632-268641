import { Routes, Route, Link, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/Auth/ProtectedRoute";
import RequireRole from "./components/Auth/RequireRole";
import useAuthStore from "./store/useAuthStore";
import "./App.css";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import AppLayout from "./components/Layout/AppLayout";
import Catalog from "./pages/courses/Catalog";
import CourseDetail from "./pages/courses/Detail";
import CartPage from "./pages/cart/CartPage";
import CheckoutPage from "./pages/checkout/CheckoutPage";
import EnrollmentSuccessPage from "./pages/checkout/EnrollmentSuccessPage";
import StudentDashboard from "./pages/student/Dashboard";
import StudentCourses from "./pages/student/Courses";
import StudentWishlist from "./pages/student/Wishlist";
import StudentQA from "./pages/student/QA";
import StudentSettings from "./pages/student/Settings";
import StudentProfileEdit from "./pages/student/ProfileEdit";

// Simple placeholder components
const Home = () => (
  <div className="card">
    <h1>Digital T3 LMS</h1>
    <p>Welcome to the Learning Management System.</p>
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      <Link className="btn" to="/courses">Browse Courses</Link>
      <Link className="btn" to="/cart">Cart</Link>
      <Link className="btn" to="/student/dashboard">Student Dashboard</Link>
      <Link className="btn" to="/instructor/dashboard">Instructor Dashboard</Link>
    </div>
  </div>
);

const InstructorDashboard = () => <div className="card"><h2>Instructor Dashboard</h2><p>Manage courses, students, and earnings.</p></div>;

// PUBLIC_INTERFACE
function App() {
  /** App router shell setting up core routes and guards with persistent layout. */
  const { user } = useAuthStore();
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route
          path="/login"
          element={!user ? <LoginPage /> : <Navigate to="/student/dashboard" replace />}
        />
        <Route
          path="/register"
          element={!user ? <RegisterPage /> : <Navigate to="/student/dashboard" replace />}
        />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
        <Route path="/enrollment-success" element={<ProtectedRoute><EnrollmentSuccessPage /></ProtectedRoute>} />

        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute>
              <RequireRole role="student">
                <StudentDashboard />
              </RequireRole>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/courses"
          element={
            <ProtectedRoute>
              <RequireRole role="student">
                <StudentCourses />
              </RequireRole>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/wishlist"
          element={
            <ProtectedRoute>
              <RequireRole role="student">
                <StudentWishlist />
              </RequireRole>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/qa"
          element={
            <ProtectedRoute>
              <RequireRole role="student">
                <StudentQA />
              </RequireRole>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/settings"
          element={
            <ProtectedRoute>
              <RequireRole role="student">
                <StudentSettings />
              </RequireRole>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/settings/profile-edit"
          element={
            <ProtectedRoute>
              <RequireRole role="student">
                <StudentProfileEdit />
              </RequireRole>
            </ProtectedRoute>
          }
        />

        <Route
          path="/instructor/dashboard"
          element={
            <ProtectedRoute>
              <RequireRole role="instructor">
                <InstructorDashboard />
              </RequireRole>
            </ProtectedRoute>
          }
        />

        <Route path="/courses" element={<Catalog />} />
        <Route path="/courses/:id" element={<CourseDetail />} />

        <Route path="*" element={<div className="card"><h2>404</h2><p>Page not found.</p></div>} />
      </Routes>
    </AppLayout>
  );
}

export default App;
