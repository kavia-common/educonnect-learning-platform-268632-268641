import { Routes, Route, Link, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/Auth/ProtectedRoute";
import RequireRole from "./components/Auth/RequireRole";
import useAuthStore from "./store/useAuthStore";
import "./App.css";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";

// Simple placeholder components
const Home = () => (
  <div className="container">
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
  </div>
);

const Cart = () => <div className="container"><div className="card"><h2>Cart</h2><p>Cart details coming soon.</p></div></div>;
const Checkout = () => <div className="container"><div className="card"><h2>Checkout</h2><p>Checkout flow coming soon.</p></div></div>;
const EnrollmentSuccess = () => <div className="container"><div className="card"><h2>Enrollment Success</h2><p>Thank you for enrolling!</p></div></div>;
const StudentDashboard = () => <div className="container"><div className="card"><h2>Student Dashboard</h2><p>Courses, progress, and more.</p></div></div>;
const StudentSettings = () => <div className="container"><div className="card"><h2>Student Settings</h2><p>Update your profile and preferences.</p></div></div>;
const InstructorDashboard = () => <div className="container"><div className="card"><h2>Instructor Dashboard</h2><p>Manage courses, students, and earnings.</p></div></div>;
const Courses = () => <div className="container"><div className="card"><h2>Courses</h2><p>Catalog listing coming soon.</p></div></div>;
const CourseDetail = () => <div className="container"><div className="card"><h2>Course Details</h2><p>Course info, curriculum, reviews.</p></div></div>;

function NavBar() {
  const { user, signOut } = useAuthStore();
  return (
    <nav style={{ background: "var(--surface)", boxShadow: "var(--shadow-sm)" }}>
      <div className="container" style={{ display: "flex", gap: 16, alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Link className="link" to="/">LMS</Link>
          <Link className="link" to="/courses">Courses</Link>
          <Link className="link" to="/cart">Cart</Link>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {!user ? (
            <>
              <Link className="btn" to="/login">Login</Link>
              <Link className="btn" to="/register">Register</Link>
            </>
          ) : (
            <>
              <Link className="btn" to="/student/dashboard">Dashboard</Link>
              <button className="btn" onClick={signOut}>Sign Out</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

// PUBLIC_INTERFACE
function App() {
  /** App router shell setting up core routes and guards. */
  const { user } = useAuthStore();
  return (
    <div className="App">
      <NavBar />
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

        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="/enrollment-success" element={<ProtectedRoute><EnrollmentSuccess /></ProtectedRoute>} />

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
          path="/instructor/dashboard"
          element={
            <ProtectedRoute>
              <RequireRole role="instructor">
                <InstructorDashboard />
              </RequireRole>
            </ProtectedRoute>
          }
        />

        <Route path="/courses" element={<Courses />} />
        <Route path="/courses/:id" element={<CourseDetail />} />

        <Route path="*" element={<div className="container"><div className="card"><h2>404</h2><p>Page not found.</p></div></div>} />
      </Routes>
    </div>
  );
}

export default App;
