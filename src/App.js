// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import { AuthProvider } from './contexts/AuthContext';
// import Login from './components/Login';
// import Signup from './components/Signup';
// import Dashboard from './components/Dashboard';
// import ProtectedRoute from './components/ProtectedRoute';
// import ForgotPassword from './components/Forgot Password';
// import SelectMedicine from './components/SelectMedicine';
// import AddMedicine from './components/AddMedicine';
// import MedicineDetails from './components/MedicineDetails';
// import LocationMap from './components/LocationMap';
// import OfflineAlert from "./components/OfflineAlert";


// import './App.css';

// function App() {
//   return (
    
//     <Router>
//        <OfflineAlert />
//       <AuthProvider>
     
//         <Routes>
//           {/* Public Routes */}
//           <Route path="/login" element={<Login />} />
//           <Route path="/signup" element={<Signup />} />
//           <Route path="/forgot-password" element={<ForgotPassword />} />
          
//           {/* Protected Routes */}
//           <Route
//             path="/dashboard"
//             element={
//               <ProtectedRoute>
//                 <Dashboard />
//               </ProtectedRoute>
//             }
//           />
//            {/* Protected Routes */}
//           <Route
//             path="/dashboard"
//             element={
//               <ProtectedRoute>
//                 <Dashboard />
//               </ProtectedRoute>
//             }
//           />
//           <Route
//             path="/track-device"
//             element={
//               <ProtectedRoute>
//                 <LocationMap />
//               </ProtectedRoute>
//             }
//           />
//           <Route
//             path="/add-medicine"
//             element={
//               <ProtectedRoute>
//                 <AddMedicine/>
//               </ProtectedRoute>
//             }
//           />
//           <Route
//             path="/select-medicine"
//             element={
//               <ProtectedRoute>
//                 <SelectMedicine />
//               </ProtectedRoute>
//             }
//           />
//           <Route
//             path="/medicine/:id"
//             element={
//               <ProtectedRoute>
//                 <MedicineDetails />
//               </ProtectedRoute>
//             }
//           />
          
//           {/* Default Route */}
//           <Route path="*" element={<Login />} />
//         </Routes>
//       </AuthProvider>
//     </Router>
//   );
// }

// export default App;


import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastContainer } from 'react-toastify';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import ForgotPassword from './components/Forgot Password';
import LocationMap from './components/LocationMap';
import AlertNotification from './components/AlertNotification';
import AddMedicine from './components/AddMedicine';
import SelectMedicine from './components/SelectMedicine';
// medi
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        {/* Toast notifications for auth */}
        <ToastContainer 
          position="top-center" 
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />

        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <>
                  <AlertNotification />
                  <Dashboard />
                </>
              </ProtectedRoute>
            }
          />
          
            {/* <Route
            path="/reminder"
            element={
              <ProtectedRoute>
                <>
                  <MedicineReminder />
                </>
              </ProtectedRoute>
            }
          /> */}

          <Route
            path="/track-device"
            element={
              <ProtectedRoute>
                <>
                  <AlertNotification />
                  <LocationMap />
                </>
              </ProtectedRoute>
            }
          />

        <Route
          path="/add-medicine"
          element={
            <ProtectedRoute>
              <AddMedicine />
            </ProtectedRoute>
          }
        />
        <Route
          path="/select-medicine"
          element={
            <ProtectedRoute>
              <SelectMedicine />
            </ProtectedRoute>
          }
        />
          {/* Default Route */}
          <Route path="*" element={<Login />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
