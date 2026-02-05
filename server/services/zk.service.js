const ZKLib = require("zklib-js");
const { db } = require("../db/connectDB");
const cron = require("node-cron");
const sendEmail = require("../utils/mailer");

// Normalize device punch time
// function normalizePunchTime(recordTime) {
//   if (!recordTime) return null;
//   const parts = recordTime.split(" ");
//   if (parts.length < 5) return null;

//   const day = parts[2];
//   const monthStr = parts[1];
//   const year = parts[3];
//   const time = parts[4];

//   const monthMap = {
//     Jan: "01", Feb: "02", Mar: "03", Apr: "04",
//     May: "05", Jun: "06", Jul: "07", Aug: "08",
//     Sep: "09", Oct: "10", Nov: "11", Dec: "12"
//   };

//   const month = monthMap[monthStr];
//   if (!month) return null;

//   return `${year}-${month}-${day} ${time}`;
// }

function normalizePunchTime(recordTime) {
  if (!recordTime) return null;
  const parts = recordTime.split(" ");
  if (parts.length < 5) return null;

  const day = parts[2].padStart(2, '0'); // Ensure 2 digits for day
  const monthStr = parts[1];
  const year = parts[3];
  const time = parts[4];

  const monthMap = {
    Jan: "01", Feb: "02", Mar: "03", Apr: "04",
    May: "05", Jun: "06", Jul: "07", Aug: "08",
    Sep: "09", Oct: "10", Nov: "11", Dec: "12"
  };

  const month = monthMap[monthStr];
  if (!month) return null;

  // Append +05:30 so the system knows this is India Time (IST)
  // Format: YYYY-MM-DD HH:mm:ss+05:30
  return `${year}-${month}-${day} ${time}+05:30`;
}

// Fetch and sync punches
// async function getDeviceAttendance() {
//   const deviceSN = "EUF7251400009";
//   const zk = new ZKLib("192.168.0.10", 4370, 10000, 4000);

//   try {
//     console.log("[SYNC] Connecting to device...");
//     await zk.createSocket();
//     await zk.enableDevice();

//     console.log("[SYNC] Fetching attendance logs...");
//     const logs = await zk.getAttendances();

//     if (!logs?.data?.length) {
//       console.log("[SYNC] No logs found");
//       return [];
//     }

//     /* ---------- LAST SYNC ---------- */
//     const { rows: trackerRows } = await db.query(
//       `SELECT last_sync FROM attendance_tracker WHERE device_sn = $1`,
//       [deviceSN]
//     );

//     let lastSync = trackerRows[0]?.last_sync || "1970-01-01 00:00:00";
//     let lastSyncDate = new Date(lastSync);
//     lastSyncDate.setSeconds(lastSyncDate.getSeconds() - 2); // buffer

//     /* ---------- FILTER NEW LOGS ---------- */
//     const newLogs = logs.data.filter(log => {
//       const punchTime = new Date(normalizePunchTime(log.recordTime));
//       return punchTime > lastSyncDate;
//     });

//     console.log(`[SYNC] New punches found: ${newLogs.length}`);

//     let latestPunch = lastSyncDate;

//     /* ---------- PROCESS LOGS ---------- */
//     for (const log of newLogs) {
//       const punchTimeStr = normalizePunchTime(log.recordTime);
//       if (!punchTimeStr) continue;

//       // SAFETY CHECK
//       const { rows: userRows } = await db.query(
//         `SELECT emp_id FROM users WHERE emp_id = $1`,
//         [String(log.deviceUserId)]
//       );

//       if (!userRows.length) continue; // skip if no employee

//       const empId = userRows[0].emp_id;

//       await db.query(
//         `INSERT INTO activity_log (emp_id, punch_time, device_ip, device_sn)
//          VALUES ($1, $2, $3, $4)
//          ON CONFLICT (emp_id, punch_time) DO NOTHING`,
//         [empId, punchTimeStr, log.ip || null, deviceSN]
//       );

//       const punchDate = new Date(punchTimeStr);
//       if (punchDate > latestPunch) latestPunch = punchDate;

//       /* ---------- SEND EMAIL ---------- */
//       try {
//         const { rows: employeeRows } = await db.query(
//           `SELECT name, email FROM users WHERE emp_id = $1`,
//           [empId]
//         );

//         if (employeeRows.length) {
//           const employee = employeeRows[0];
//           const time = punchDate.toLocaleTimeString("en-IN", { hour12: false });
//           const action = log.type || "in"; // if your device provides type

//           // await sendEmail(
//           //   employee.email,
//           //   `Punch ${action}`,
//           //   "punch_in_out",
//           //   { name: employee.name, action, time }
//           // );

//           console.log(` Punch ${action} email sent to ${employee.email}`);
//         }
//       } catch (err) {
//         console.error(" Error sending punch email:", err);
//       }
//     }

   
//     if (newLogs.length) {
//       const finalLastSync = latestPunch
//         .toISOString()
//         .slice(0, 19)
//         .replace("T", " ");

//       await db.query(
//         `INSERT INTO attendance_tracker (device_sn, last_sync)
//          VALUES ($1, $2)
//          ON CONFLICT (device_sn)
//          DO UPDATE SET last_sync = EXCLUDED.last_sync`,
//         [deviceSN, finalLastSync]
//       );
//     }

//     console.log("[SYNC] Punch sync completed successfully");
//     return newLogs;

//   } catch (err) {
//     console.error("[SYNC] Error:", err);
//     throw err;
//   } finally {
//     try {
//       await zk.disconnect();
//       console.log("[SYNC] Device disconnected");
//     } catch {
//       console.warn("[SYNC] Device disconnect failed");
//     }
//   }
// }

async function getDeviceAttendance() {
  const deviceSN = "EUF7251400009";
  const deviceIP = "192.168.0.10";
  const zk = new ZKLib(deviceIP, 4370, 10000, 4000);

  try {
      console.log("[SYNC] Connecting to device...");
      await zk.createSocket();
      await zk.enableDevice();

      console.log("[SYNC] Fetching attendance logs...");
      const logs = await zk.getAttendances();

      if (!logs?.data?.length) {
          console.log("[SYNC] No logs found");
          return [];
      }

      /* ---------- GET LAST SYNC TRACKER ---------- */
      const { rows: trackerRows } = await db.query(
          `SELECT last_sync FROM attendance_tracker WHERE device_sn = $1`,
          [deviceSN]
      );

      let lastSync = trackerRows[0]?.last_sync || "1970-01-01 00:00:00";
      let lastSyncDate = new Date(lastSync);
      // Small buffer to ensure no overlap loss
      lastSyncDate.setSeconds(lastSyncDate.getSeconds() - 2); 

      /* ---------- FILTER NEW LOGS ---------- */
      const newLogs = logs.data.filter(log => {
          const punchTime = new Date(normalizePunchTime(log.recordTime));
          return punchTime > lastSyncDate;
      });

      console.log(`[SYNC] New punches found: ${newLogs.length}`);
      let latestPunch = lastSyncDate;

      /* ---------- PROCESS LOGS ---------- */
      for (const log of newLogs) {
          const punchTimeStr = normalizePunchTime(log.recordTime);
          if (!punchTimeStr) continue;

          // 1. Initialize punchDate
          const punchDate = new Date(punchTimeStr);

          // Check if user exists
          const { rows: userRows } = await db.query(
              `SELECT emp_id, name, email FROM users WHERE emp_id = $1`,
              [String(log.deviceUserId)]
          );

          if (!userRows.length) continue; 
          const employee = userRows[0];

          // 2. Insert into activity_log (Conflict check handles duplicates)
          const insertRes = await db.query(
              `INSERT INTO activity_log (emp_id, punch_time, device_ip, device_sn)
               VALUES ($1, $2, $3, $4)
               ON CONFLICT (emp_id, punch_time) DO NOTHING`,
              [employee.emp_id, punchTimeStr, deviceIP, deviceSN]
          );

          // Update high-water mark for the tracker
          if (punchDate > latestPunch) latestPunch = punchDate;

          // 3. TRIGGER NOTIFICATION ONLY IF INSERTED
          if (insertRes.rowCount > 0) {
              const timeStr = punchDate.toLocaleTimeString("en-IN", { 
                  hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' 
              });

              const dd = String(punchDate.getDate()).padStart(2, '0');
              const mm = String(punchDate.getMonth() + 1).padStart(2, '0');
              const yyyy = punchDate.getFullYear();
              const formattedDate = `${dd}-${mm}-${yyyy}`;

              const dayName = punchDate.toLocaleDateString('en-IN', { 
                  weekday: 'long', timeZone: 'Asia/Kolkata' 
              });

              const action = log.type || "Punch";
            
              try {
                  // Fetch earliest punch for today to calculate duration
                  const { rows: firstPunchRow } = await db.query(
                      `SELECT MIN(punch_time) as first_punch 
                       FROM activity_log 
                       WHERE emp_id = $1 AND punch_time::DATE = $2::DATE`,
                      [employee.emp_id, punchTimeStr]
                  );
            
                  let punchInTime = timeStr;
                  let totalDuration = "Calculating...";
                  let showSummary = false;
            
                  if (firstPunchRow.length > 0 && firstPunchRow[0].first_punch) {
                      const firstPunchDate = new Date(firstPunchRow[0].first_punch);
                      punchInTime = firstPunchDate.toLocaleTimeString("en-IN", { 
                          hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' 
                      });
            
                      const diffMs = punchDate - firstPunchDate;
                      if (diffMs > 60000) { // If more than 1 minute passed
                          const totalMinutes = Math.floor(diffMs / 60000);
                          const hours = Math.floor(totalMinutes / 60);
                          const minutes = totalMinutes % 60;
                          totalDuration = `${hours}h ${minutes}m`;
                          showSummary = true; 
                      }
                  }

                  // 4. Send the email
                  // await sendEmail(
                  //   employee.email,
                  //     `Attendance Notification: ${action}`,
                  //     "punch_in_out",
                  //     { 
                  //         name: employee.name,
                  //         emp_id:employee.emp_id, 
                  //         action, 
                  //         date: formattedDate, 
                  //         day: dayName,
                  //         time: timeStr,
                  //         punch_in: punchInTime,
                  //         punch_out: action.toLowerCase().includes("out") || showSummary ? timeStr : "---",
                  //         duration: showSummary ? totalDuration : "Initial Punch",
                  //         is_out: showSummary 
                  //     }
                  // );
            
              } catch (dbErr) {
                  console.error("Email processing error:", dbErr);
              }
          }
      }

      /* ---------- UPDATE TRACKER ---------- */
      if (newLogs.length) {
          const finalLastSync = latestPunch.toISOString().slice(0, 19).replace("T", " ");
          await db.query(
              `INSERT INTO attendance_tracker (device_sn, last_sync)
               VALUES ($1, $2)
               ON CONFLICT (device_sn)
               DO UPDATE SET last_sync = EXCLUDED.last_sync`,
              [deviceSN, finalLastSync]
          );
      }

      console.log("[SYNC] Completed successfully");
      return newLogs;

  } catch (err) {
      console.error("[SYNC] Error:", err);
      throw err;
  } finally {
      try {
          await zk.disconnect();
          console.log("[SYNC] Device disconnected");
      } catch {
          console.warn("[SYNC] Device disconnect failed");
      }
  }
}

// 5-minute cron sync
let isSyncRunning = false;
cron.schedule("*/5 * * * *", async () => {
  if (isSyncRunning) {
    console.warn("[CRON] Previous sync still running, skipping");
    return;
  }
  isSyncRunning = true;
  try {
    await getDeviceAttendance();
  } finally {
    isSyncRunning = false;
  }
});

// 
let isSyncRunning2 = false;
cron.schedule("*/1 * * * *", async () => {
  if (isSyncRunning2) {
    console.warn("[CRON] Previous sync still running, skipping");
    return;
  }
  isSyncRunning2 = true;
  try {
    await getDeviceAttendance();
  } finally {
    isSyncRunning2 = false;
  }
});
module.exports = { getDeviceAttendance };


