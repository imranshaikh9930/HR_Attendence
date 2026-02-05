import { Typography } from "@mui/material";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { FaCalendarCheck, FaRegClock, FaCheckCircle, FaCalendarAlt } from "react-icons/fa";
import { TfiMenuAlt } from "react-icons/tfi";

import Leavecards from "../components/Leavecards";
import LeavesTable from "../components/LeavesTable";
import Loader from "../components/Loader";

const Adminleaves = () => {
  const [activeTab, setActiveTab] = useState("pending");
  const [leaveTableData, setLeaveTableData] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, month: 0 });
  const [loading, setLoading] = useState(true);

  // Get current logged-in Admin/Manager ID
  const managerId = localStorage.getItem("emp_id");

  const fetchAdminData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Leaves pending for THIS manager
      // Endpoint: GET /api/leaves/pending-approvals/:managerId
      const response = await axios.get(`http://localhost:5500/api/leaves/pending-approvals/${managerId}`);

      const allData = response.data;
      setLeaveTableData(allData);

      // 2. Calculate Stats from the fetched data
      const pending = allData.filter(l => l.status === 'pending').length;
      const approved = allData.filter(l => l.status === 'approved').length;

      setStats({
        total: allData.length,
        pending: pending,
        approved: approved,
        month: allData.filter(l => new Date(l.applied_at).getMonth() === new Date().getMonth()).length
      });

    } catch (error) {
      console.error("Failed to fetch admin leave data", error);
    } finally {
      setLoading(false);
    }
  }, [managerId]);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  // Handle Tab Filtering locally for performance
  const filteredLeaves = leaveTableData.filter((item) => {
    if (activeTab === "pending") return item.status === "pending";
    if (activeTab === "all") return true; // Shows both approved and rejected in history
    return false;
  });

  const adminLeaveCards = [
    { id: 1, request: "Total Request", total: stats.total, icon: <FaCalendarCheck />, bgColor: "#0e6efe" },
    { id: 2, request: "Pending", total: stats.pending, icon: <FaRegClock />, bgColor: "#FFC107" },
    { id: 3, request: "Approved", total: stats.approved, icon: <FaCheckCircle />, bgColor: "#1A8755" },
    { id: 4, request: "This Month", total: stats.month, icon: <FaCalendarAlt />, bgColor: "#0EC9F0" }
  ];

  const adminLeaveTableHeader = [
    "Employee", "Period", "Days", "Type", "Reason", "Current Level", "Actions"
  ];

  if (loading) return <div className="flex items-center justify-center h-[70vh]">
  <Loader />
</div>;

  return (
    <div className="px-3 pb-6">
      <div className="sticky top-0 z-50 bg-[#222F7D] rounded-lg">
        <Typography className="text-white py-2 text-2xl text-center">Leave Requests</Typography>
      </div>

      <h1 className="text-lg mt-4 py-1">Manager Dashboard</h1>

      <Leavecards LeavecardData={adminLeaveCards} />

      {/* Tabs */}
      <div className="flex items-center gap-4 w-full px-3 py-2 mt-4">
        <div
          onClick={() => setActiveTab("pending")}
          className={`px-3 py-2 rounded-md cursor-pointer relative ${activeTab === "pending" ? "bg-[#1a8755] text-white" : "bg-[#1a8755] bg-opacity-10 text-[#1a8755] border border-[#1a8755]"
            }`}
        >
          <p className="flex items-center gap-1.5">
            <FaRegClock />
            <span>Pending Approvals</span>
          </p>
          {stats.pending > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 text-xs rounded-full flex items-center justify-center">
              {stats.pending}
            </span>
          )}
        </div>

        <div
          onClick={() => setActiveTab("all")}
          className={`px-3 py-2 rounded-md flex items-center gap-1.5 cursor-pointer ${activeTab === "all" ? "bg-[#1a8755] text-white" : "text-[#1a8755] border bg-[#1a8755] bg-opacity-10 border-[#1a8755]"
            }`}
        >
          <TfiMenuAlt />
          <span>History</span>
        </div>
      </div>

      {/* Content */}
      <div className="mt-6">
        <LeavesTable
          adminLeavesHeader={adminLeaveTableHeader}
          adminLeavesBody={filteredLeaves}
          refreshData={fetchAdminData} // Pass refresh function to table
        />
      </div>
    </div>
  );
};

export default Adminleaves;