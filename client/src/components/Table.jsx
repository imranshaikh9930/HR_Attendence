import React, { useContext, useMemo, useEffect } from "react";
import { EmployContext } from "../context/EmployContextProvider";
import Loader from "./Loader";

// Status Badge remains the same
const StatusBadge = ({ status }) => {
  const styles = {
    Present: "bg-green-600 text-white",
    Working: "bg-blue-600 text-white",
    Late: "bg-yellow-500 text-white",
    Absent: "bg-red-600 text-white",
    "Half Day": "bg-orange-500 text-white",
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold ${styles[status] || "bg-gray-300 text-gray-800"}`}>
      {status}
    </span>
  );
};

// FIX: Holiday match using local date string to handle UTC offsets (18:30 Z)
const getHolidayMatch = (attendanceDate, holidays = []) => {
  if (!attendanceDate || !holidays.length) return null;
  
  // Use toDateString() as it compares the actual calendar day in local time
  const aDate = new Date(attendanceDate).toDateString();
  
  return holidays.find(h => {
    const hDate = new Date(h.holiday_date).toDateString();
    return aDate === hDate;
  });
};

// Fix: Don't let new Date() shift the time if the backend already formatted it
const formatTime = (value) => {
  if (!value) return "--";
  
  // If the backend is now sending "11:15 AM", just return it
  if (typeof value === 'string' && (value.includes("AM") || value.includes("PM"))) {
    return value;
  }

  // Fallback for raw ISO strings: Force Asia/Kolkata display
  try {
    const d = new Date(value);
    return d.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (e) {
    console.log(e);
    return value;
  }
};

// Fix: Ensure Date display doesn't jump a day backward due to UTC offsets
const formatDate = (value) => {
  if (!value) return "--";
  const date = new Date(value);
  return date.toLocaleDateString("en-GB", { timeZone: "Asia/Kolkata" });
};

const EmpformatDate = (dateStr) => {
  if (!dateStr) return "--";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { weekday: "short" });
};

const formatInterval = (val) => {
  if (!val) return "--";
  if (typeof val === "string") return val;
  if (typeof val === "object") {
    const h = String(val.hours || 0).padStart(2, "0");
    const m = String(val.minutes || 0).padStart(2, "0");
    return `${h}:${m}`;
  }
  return "--";
};

const Table = () => {
  const { adminAttendance = [], employeeAttendance = [], loading, filters, holidays } = useContext(EmployContext);

  // useEffect(()=>{
  //   console.log("employeeAttendance",employeeAttendance)
  // },[])
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = (user?.role || "").toLowerCase();
  const isAdmin = role === "admin";

  const data = isAdmin
    ? adminAttendance
    : employeeAttendance.filter((a) => a.emp_id === user.emp_id);

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
          row.name?.toLowerCase().includes(search) ||
          String(row.emp_id || "").includes(search)
      );
    }
    return result;
  }, [data, filters, isAdmin]);

  // Updated Row styling to include Holiday color
  const getRowClass = (dayStr, isToday, isHoliday, index) => {
    if (isHoliday) return "bg-blue-50 text-blue-900 font-medium"; // Holiday row color
    if (!isAdmin && dayStr === "Sun") return "bg-[#faa307] text-white font-semibold";
    if (!isAdmin && dayStr === "Sat") return "bg-[#D1FFBD] text-dark font-semibold";
    if (!isAdmin && isToday) return "bg-blue-100 font-semibold";
    return index % 2 === 0 ? "bg-white" : "bg-gray-50";
  };

  const headers = isAdmin
    ? ["Sr No", "Emp ID", "Employee", "Date", "Status", "Punch In", "Punch Out", "Working Hours", "Expected Hours"]
    : ["Day", "Date", "Status", "Punch In", "Punch Out", "Working Hours", "Expected Hours"];

  if (loading) return <div className="flex items-center justify-center h-[70vh]"><Loader /></div>;
  if (!filteredData.length) return <div className="flex items-center justify-center h-[70vh] text-gray-500">No attendance data found</div>;

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
    <table className="min-w-full text-sm border-collapse">
      <thead className="bg-gray-100 sticky top-0 z-10">
        <tr>
          {headers.map((h, i) => (
            <th key={i} className="border-b px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-white">
        {filteredData
          // Only show active employees in Admin view; Employees see all their own history
          .filter((row) => 
            row.emp_id && (isAdmin ? row.is_active === true : true)
          )
          .map((row, i) => {
            const dayStr = EmpformatDate(row.attendance_date);
            const holidayMatch = getHolidayMatch(row.attendance_date, holidays);
            const isAbsent = row.status === "Absent" && !holidayMatch;
            const isToday = new Date(row.attendance_date).toDateString() === new Date().toDateString();
            
            // Use employee_name from your JSON or fallback to row.name
            const displayName = row.employee_name || row.name || "--";
  
            return (
              <tr 
                key={row.emp_id ? `${row.emp_id}-${i}` : i} 
                className={`${getRowClass(dayStr, isToday, !!holidayMatch, i)}  transition-colors`}
              >
                {isAdmin ? (
                  /* ADMIN VIEW: FOCUS ON EMPLOYEE LIST */
                  <>
                    <td className="border-b px-4 py-2 text-gray-600">{i + 1}</td>
                    <td className="border-b px-4 py-2 font-medium text-gray-800 whitespace-nowrap">{row.emp_id || "--"}</td>
                    <td className="border-b px-4 py-2 whitespace-nowrap">{displayName}</td>
                    <td className="border-b px-4 py-2 whitespace-nowrap">{formatDate(row.attendance_date)}</td>
                    <td className="border-b px-4 py-2">
                      {holidayMatch ? (
                        <span className="inline-block text-blue-700 font-bold bg-blue-100 px-2 py-0.5 rounded border border-blue-200 text-[10px] uppercase">
                          {holidayMatch.holiday_name}
                        </span>
                      ) : (
                        <StatusBadge status={row.status} />
                      )}
                    </td>
                    <td className="border-b px-4 py-2 whitespace-nowrap">
                      {(isAbsent || holidayMatch) ? "--" : formatTime(row.punch_in)}
                    </td>
                    <td className="border-b px-4 py-2 whitespace-nowrap">
                      {(isAbsent || holidayMatch) ? "--" : row.punch_out ? formatTime(row.punch_out) : <span className="text-orange-500">Working...</span>}
                    </td>
                    <td className="border-b px-4 py-2">
                      {(isAbsent || holidayMatch) ? "--" : formatInterval(row.total_hours)}
                    </td>
                    <td className="border-b px-4 py-2">
                      {(isAbsent || holidayMatch) ? "0" : (dayStr === "Sat" ? "5" : "9.3")}
                    </td>
                  </>
                ) : (
                  /* EMPLOYEE VIEW: FOCUS ON PERSONAL CALENDAR/HISTORY */
                  <>
                    <td className="border-b px-4 py-2 font-semibold text-gray-600">{dayStr}</td>
                    <td className="border-b px-4 py-2 whitespace-nowrap">{formatDate(row.attendance_date)}</td>
                    <td className="border-b px-4 py-2">
                      {holidayMatch ? (
                        <span className="text-blue-700 font-bold whitespace-nowrap">{holidayMatch.holiday_name}</span>
                      ) : dayStr === "Sun" ? (
                        <span className="text-white">WeekDay Off</span>
                      ) : (
                        <StatusBadge status={row.status} />
                      )}
                    </td>
                    <td className="border-b px-4 py-2">
                      {(dayStr === "Sun" || holidayMatch || isAbsent) ? "" : formatTime(row.punch_in)}
                    </td>
                    <td className="border-b px-4 py-2">
                      {(dayStr === "Sun" || holidayMatch || isAbsent) ? "" : row.punch_out ? formatTime(row.punch_out) : "Working..."}
                    </td>
                    <td className="border-b px-4 py-2">
                      {(dayStr === "Sun" || holidayMatch || isAbsent) ? "" : formatInterval(row.total_hours)}
                    </td>
                    <td className="border-b px-4 py-2">
                      {(dayStr === "Sun" || holidayMatch) ? "" : (dayStr === "Sat" ? "5" : "9.3")}
                    </td>
                  </>
                )}
              </tr>
            );
          })}
      </tbody>
    </table>
  </div>
  );
};

export default Table;