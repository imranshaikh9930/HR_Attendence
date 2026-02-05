import React, { createContext, useEffect, useState, useMemo, use } from "react";
import axios from "axios";
import ProfImg from "../assets/avatar.webp"
export const EmployContext = createContext();

const EmployProvider = ({ children }) => {

  
  /* Attendance  */
  const [employee, setEmployee] = useState(null);
  const [employeeAttendance, setEmployeeAttendance] = useState([]);
  const [singleAttendance, setSingleAttendance] = useState(null);
  const [adminAttendance, setAdminAttendance] = useState([]);
  const [activelogs,setActiveLogs] = useState([]);
  const [singleAdminAttendance,setSingleAdminAttendance] = useState([]);

  /*Loading State*/
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const token = localStorage.getItem("token");
  const emp_id = localStorage.getItem("user")?.role;

  /* Profile Address */
  const [orgAddress,setOrgAddress] = useState("");

  //  Holidays

  const [holidays,setHolidays] = useState([]);
  /*  Filter State*/
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
  });

  // Profile Image
  const [profileImage,setProfileImage] = useState(ProfImg);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* 
    auth state
  */
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    return {
      token,
      role: user?.role?.toLowerCase() || null,
    };
  });

  /*Sync login */
  useEffect(() => {
    const syncAuth = () => {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      setAuth({
        token,
        role: user?.role?.toLowerCase() || null,
      });
    };

    syncAuth();
    window.addEventListener("storage", syncAuth);

    return () => window.removeEventListener("storage", syncAuth);
  }, []);

  /*
     AXIOS CONFIG
*/
  const axiosConfig = useMemo(
    () => ({
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
    }),
    [auth.token]
  );

//  Employee dashboard
const fetchEmployeeDashboard = async () => {
  try {
    setEmployeeLoading(true);

    const [historyRes, todayRes] = await Promise.all([
      axios.get(
        "http://localhost:5000/api/employee/attendance/history",
        axiosConfig
      ),
      axios.get(
        "http://localhost:5000/api/employee/attendance/today",
        axiosConfig
      ),
    ]);

    // History response
    if (historyRes.data && Array.isArray(historyRes.data.attendance)) {
      setEmployeeAttendance(historyRes.data.attendance);

      if (historyRes.data.attendance.length > 0) {
        const emp = historyRes.data.attendance[0];
        setEmployee({
          emp_id: emp.emp_id,
          device_user_id: emp.device_user_id ?? null,
          name: emp.employee_name,
        });
      }
    } else {
      setEmployeeAttendance([]);
    }

    // Today attendance
    setSingleAttendance(todayRes.data || null);

  } catch (err) {
    console.error("Dashboard Fetch Error:", err);

    if (axios.isAxiosError(err)) {
      const status = err.response?.status;

      console.log("Status Code:", status);
      console.log("Message:", err.response?.data);

      //  HANDLE 401
      if (status === 401) {
        console.warn("401 Unauthorized → Removing token");

        localStorage.removeItem("token");
        localStorage.removeItem("user"); // if stored

        // redirect to login
        window.location.href = "/login";
        return;
      }
    }

    setEmployeeAttendance([]);
    setSingleAttendance(null);

  } finally {
    setEmployeeLoading(false);
    setInitialized(true);
  }
};


  // Employees Holidays


  const fetchHolidays = async () => {
    try {
      const resp = await axios.get(
        "http://localhost:5000/api/employee/attendance/holiday",
        axiosConfig
      );
      setHolidays(resp.data);
    } catch (err) {
      console.error(err);
      setHolidays([]);
    }
  };
  
  // Admin Dashboard
  const fetchAdminAttendance = async () => {
    // Check token first
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("No token found → redirecting to login");
      window.location.href = "/login";
      return;
    }
  
    try {
      setAdminLoading(true);
  
      const axiosConfig = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
  
      const res = await axios.get(
        "http://localhost:5000/api/admin/attendance/today",
        axiosConfig
      );
      
      console.log(res);
      setAdminAttendance(Array.isArray(res?.data) ? res.data : []);
  
    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
  
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        console.log("Status Code:", status);
        console.log("Message:", err.response?.data);
  
        if (status === 401) {
          console.warn("401 Unauthorized → Removing token");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/login";
          return;
        }
      }
  
      // Admin-only cleanup
      setAdminAttendance([]);
    } finally {
      setAdminLoading(false);
      setInitialized(true);
    }
  };
  


  // Fetch On Auth
  useEffect(() => {
    if (!auth.token || !auth.role) return;
  
    setInitialized(false);
  
    if (auth.role === "admin") {
      fetchAdminAttendance();
    }
  
    if (auth.role === "employee") {
      Promise.all([
        fetchEmployeeDashboard(),
        fetchHolidays(),
      ]);
    }
  
  }, [auth.token, auth.role]);
  

  const loading =
    auth.role === "admin" ? adminLoading : employeeLoading;

    const refreshImage = async () => {
      if (!token) return;
      try {
        const res = await axios.get("http://localhost:5000/api/employee/profile/image", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data?.profile_image) {
          // One timestamp for the whole app
          setProfileImage(`${res.data.profile_image}?t=${new Date().getTime()}`);
        }
      } catch (err) {
        setProfileImage(ProfImg);
      }
    };
  
    useEffect(() => { refreshImage(); }, [token,emp_id]);
  return (
    <EmployContext.Provider
      value={{
        employee,
        employeeAttendance,
        singleAttendance,
        adminAttendance,
        setAdminAttendance,
        orgAddress,
        setOrgAddress,
        holidays,
        loading,
        initialized,
        profileImage,
        setProfileImage,
        refreshImage,
        activelogs,
        setActiveLogs,
        singleAdminAttendance,
        setSingleAdminAttendance,

        /* Filters */
        filters,
        setFilters
        ,
        handleFilterChange,
        

        /* Refresh */
        refreshEmployeeDashboard: fetchEmployeeDashboard,
        refreshAdminAttendance: fetchAdminAttendance,
        
      }}
    >
      {children}
    </EmployContext.Provider>
  );
};

export default EmployProvider;
