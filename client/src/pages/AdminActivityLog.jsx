import { Typography, Pagination, CircularProgress } from '@mui/material';
import React, { useEffect, useState, useCallback, useContext } from 'react';
import axios from 'axios';
import Filters from '../components/Filters';
import Loader from '../components/Loader';
import { EmployContext } from '../context/EmployContextProvider';

const AdminActivityLog = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
    const [filters, setFilters] = useState({ from: '', to: '' });
    const [page, setPage] = useState(1);
    const {setActiveLogs,} = useContext(EmployContext);

    const fetchLogs = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");

            // Constructing query string
            let url = `http://localhost:5000/api/admin/attendance/activity-log?page=${page}&limit=20`;
            if (filters.from && filters.to) {
                url += `&from=${filters.from}&to=${filters.to}`;
            }

            const res = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setData(res.data.data);
            setActiveLogs(res.data.data);
            setPagination(res.data.pagination);
        } catch (err) {
            console.error("Error fetching logs:", err);
        } finally {
            setLoading(false);
        }
    }, [page, filters]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const handlePageChange = (event, value) => {
        setPage(value);
    };

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
        setPage(1); // Reset to first page when filtering
    };

    return (
        <div className="min-h-screen py-6 px-4 bg-gray-50">
            <div className="sticky z-20 top-0 bg-[#222F7D] rounded-xl py-2 mb-6 shadow-lg">
                <Typography className="text-white text-2xl text-center font-bold">
                    Activity Logs
                </Typography>
            </div>

            {/* Pass your filter handling logic here */}
            <Filters onFilter={handleFilterChange} />

            <div className="overflow-auto w-full border border-gray-300 rounded max-h-[500px] mt-4 bg-white">
                {loading ? (
                    <div className="flex flex-col justify-center items-center min-h-[400px] w-full bg-white rounded-lg border border-gray-200">
                        <Loader />
                        <p className="mt-4 text-gray-500 font-medium animate-pulse">
                            Loading activity logs...
                        </p>
                    </div>
                ) : (
                    <table className="min-w-full text-sm border-collapse">
                        <thead className="bg-gray-100 sticky top-0 z-10">
                            <tr>
                                {["Sr No", "Emp ID", "Punch Date", "Punch Time", "Device IP", "Device SN"].map((h, i) => (
                                    <th key={i} className="border px-4 py-3 font-semibold text-left bg-gray-100 sticky top-0">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, i) => {
                                // Format the ISO punch_time into Date and Time strings
                                const punchDate = new Date(row.punch_time).toLocaleDateString('en-IN');
                                const punchTime = new Date(row.punch_time).toLocaleTimeString('en-IN', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                    hour12: true
                                });

                                return (
                                    <tr key={i} className="hover:bg-gray-50 border-b">
                                        <td className="border px-4 py-2">{(page - 1) * 20 + (i + 1)}</td>
                                        <td className="border px-4 py-2 font-medium">{row.emp_id}</td>
                                        <td className="border px-4 py-2">{punchDate}</td>
                                        <td className="border px-4 py-2 text-gray-600 font-semibold">{punchTime}</td>
                                        <td className="border px-4 py-2 text-gray-600">{row.device_ip}</td>
                                        <td className="border px-4 py-2 text-xs font-mono text-gray-500">{row.device_sn}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-end mt-6">
                <Pagination
                    count={pagination.totalPages}
                    page={page}
                    onChange={handlePageChange}
                    color="primary"
                    variant="outlined"
                    shape="rounded"
                />
            </div>
        </div>
    );
};

export default AdminActivityLog;