 import React, { use, useContext, useEffect, useMemo, useState } from "react";
import Loader from "../components/Loader";
import { EmployContext } from "../context/EmployContextProvider";
import Filters from "../components/Filters";


const StatusBadge = ({ status }) => {

  console.log("Status",status)
  const styles = {
    Present: "bg-green-600 text-white",
    Working: "bg-blue-600 text-white",
    Late: "bg-yellow-500 text-white",
    Absent: "bg-red-600 text-white",
    "Half Day": "bg-orange-500 text-white",
  };

  return (
    <span
      className={`px-2 py-1 rounded text-xs font-semibold ${styles[status] || "bg-gray-300 text-gray-800"
        }`}
    >
      {status}
    </span>
  );
};



const formatDate = (value) => {
  if (!value) return "--";
  return new Date(value).toLocaleDateString("en-GB");
};

const formatInterval = (val) => {
  if (!val || val === "0h 0m") return "00:00";

  // Case 1: If it's the string "8h 23m" from your backend
  if (typeof val === "string" && val.includes('h')) {
    const parts = val.match(/\d+/g); // Extracts numbers: ["8", "23"]
    if (parts) {
      const h = parts[0].padStart(2, "0");
      const m = (parts[1] || "0").padStart(2, "0");
      return `${h}:${m}`;
    }
  }

  // Case 2: If it's a raw Postgres object { hours: 8, minutes: 23 }
  if (typeof val === "object") {
    const h = String(val.hours || 0).padStart(2, "0");
    const m = String(val.minutes || 0).padStart(2, "0");
    return `${h}:${m}`;
  }

  return val;
};

// Usage in your Excel map:
// "Total Hours": formatInterval(row.total_hours_str) // Output: "08:23"


const AdminAttendance = () => {
  const { filters,
    setSingleAdminAttendance, } = useContext(EmployContext);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);



  const isAdmin = true; // adjust based on your auth context

  // Fetch data from API
  useEffect(() => {
    const fetchAttendance = async () => {
      const token = localStorage.getItem("token"); // get token from localStorage
      if (!token) {
        console.warn("No token found → redirecting to login");
        window.location.href = "/login"; // redirect immediately
        return;
      }

      try {
        setLoading(true);

        const res = await fetch("http://localhost:5000/api/admin/attendance/history", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // send token in header
          },
        });

        if (res.status === 401) {
          console.warn("Unauthorized → redirecting to login");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/login";
          return;
        }

        const json = await res.json();

        console.log("json",json);

        if (res.ok) {
          setData(json.attendance || []);
        setSingleAdminAttendance(json.attendance);

        } else {
          console.error("Error fetching attendance:", json.message || res.statusText);
        }

      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, []);


  // Filtered data based on date range and search
  const filteredData = useMemo(() => {
    let result = [...data];

    const normalizeDate = (d) => {
      if (!d) return null;
      const date = new Date(d);
      date.setHours(0, 0, 0, 0);
      return date;
    };

    const start = normalizeDate(filters?.startDate);
    const end = normalizeDate(filters?.endDate);

    if (start) result = result.filter((row) => normalizeDate(row.attendance_date) >= start);
    if (end) result = result.filter((row) => normalizeDate(row.attendance_date) <= end);

    if (isAdmin && filters?.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(
        (row) =>
          row.employee_name?.toLowerCase().includes(search) ||
          String(row.emp_id || "").includes(search)
      );
    }

    return result;
  }, [data, filters, isAdmin]);



  // Row styling function
  const getRowClass = (dayStr, isToday, index) => {
    if (isAdmin && dayStr === "Sun") return "bg-orange-500 text-white font-semibold";
    if (isAdmin && dayStr === "Sat") return "bg-green-200 text-black font-semibold";
    if (isAdmin && isToday) return "bg-blue-100 font-semibold";
    return index % 2 === 0 ? "bg-white" : "bg-gray-50";
  };

  if (loading) return <div className="flex items-center justify-center h-[70vh]">
    <Loader />
  </div>;
  
  const handleFilterClick = () => { }
  return (
    <div className="min-h-screen bg-gray-100 px-3 pb-6">
      <div className="overflow-auto w-full border border-gray-300 rounded max-h-[500px] mt-4">
        <Filters filterClick={handleFilterClick} adminData={data} />
        <table className="min-w-full text-sm border-collapse">
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr>
              {[
                "Sr No",
                "Emp ID",
                "Date",
                "Status",
                "Punch In",
                "Punch Out",
                "Working Hours",
                "Expected Hours",
              ].map((h, i) => (
                <th key={i} className="border px-4 py-3 font-semibold text-left">
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {filteredData.map((row, i) => {
              const isAbsent = row.status === "Absent";
              const dayStr = new Date(row.attendance_date).toLocaleDateString("en-US", { weekday: "short" });
              const isToday = new Date(row.attendance_date).toDateString() === new Date().toDateString();
              const rowClass = getRowClass(dayStr, isToday, i);

              return (
                <tr key={i} className={rowClass}>
                  <td className="border px-4 py-2">{i + 1}</td>
                  <td className="border px-4 py-2">{row.emp_id}</td>
                  <td className="border px-4 py-2"> {formatDate(row.attendance_date)}</td>
                  <td className="border px-4 py-2">
                    {dayStr === "Sun" ? "WeekDay Off" : <StatusBadge status={row.status} />}
                  </td>
                  <td className="border px-4 py-2">
                    {dayStr === "Sun" || isAbsent ? "" : row.punch_in.toUpperCase()}
                  </td>
                  <td className="border px-4 py-2">
                    {dayStr === "Sun" || isAbsent ? "" : row.punch_out ? row.punch_out.toUpperCase() : "Working..."}
                  </td>
                  <td className="border px-4 py-2">
                    {dayStr === "Sun" || isAbsent ? "" : formatInterval(row.total_hours_str)}
                  </td>
                  <td className="border px-4 py-2">{dayStr === "Sun" ? "" : dayStr === "Sat" ? "5" : "9.3"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminAttendance;
