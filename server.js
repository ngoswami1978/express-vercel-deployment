const express = require("express");
var bodyParser = require("body-parser");
const { check, validationResult } = require('express-validator')
const fs = require("fs");
const axios = require("axios");
const cron = require("node-cron");
const moment = require("moment-timezone");
const nodemailer = require("nodemailer");

const seatbookjson ="public/data/seat.json";
const url = "https://server.vizmo.in/vms/classes/DeskBooking";

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
//const urlencodedParser = bodyParser.urlencoded({ extended: false })

// Set Templating Enginge
app.set("view engine", "ejs");

//render css files
app.use(express.static("public"));

const port = process.env.PORT || 3000;

app.get("/", async (req, res) => {
  console.log("🔥 Route '/' hit:", new Date().toLocaleString());

  const startTime = new Date().toLocaleString();
  const bookingResults = await sendBookings();
  const endTime = new Date().toLocaleString();

  // Build HTML Table Rows
  const tableRows = bookingResults.map(result => `
      <tr style="border-bottom:1px solid #ccc;">
        <td style="padding:8px;">${result.user}</td>
        <td style="padding:8px; font-weight:bold; color:${result.status === "Success" ? "green" : "red"};">
          ${result.status}
        </td>
        <td style="padding:8px;">${result.status === "Success" ? JSON.stringify(result.response) : JSON.stringify(result.error)}</td>
      </tr>
  `).join("");

  const htmlResponse = `
    <div style="font-family:Arial; padding:20px;">
      <h2>🚀 Seat Booking Execution Report</h2>
      <p><strong>Start Time:</strong> ${startTime}</p>
      <p><strong>End Time:</strong> ${endTime}</p>
      <hr>

      <h3>📌 Booking Results</h3>
      <table style="width:100%; border-collapse:collapse; border:1px solid #ccc;">
        <thead>
          <tr style="background:#f5f5f5;">
            <th style="padding:8px;">User</th>
            <th style="padding:8px;">Status</th>
            <th style="padding:8px;">Details</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>

      <br>
      <p style="font-size:14px; color:#555;">📬 Email Notification: <strong>Sent</strong></p>

      <br><br>
      <p style="font-size:12px; color:#888;">Made with ❤️ by Neeraj Automation System</p>
    </div>
  `;

  res.send(htmlResponse);

  console.log("⏰ Task completed:", endTime);
  sendMail();
});





async function sendBookings() {
    const results = [];

    try {
        const jsonString = fs.readFileSync(seatbookjson, "utf8");
        const seatbook_list = JSON.parse(jsonString);

        const indiaTomorrow = moment().tz("Asia/Kolkata");

        console.log("Tomorrow India Time:", indiaTomorrow.format());

        for (let i = 0; i < seatbook_list.length; i++) {
            const booking = seatbook_list[i];
            console.log(`📌 Sending booking for ${i + 1} for ${booking.assignedTo.name}`);

            const originalDate = moment(booking.recurrence.range.startDate.iso);

            originalDate
                .year(indiaTomorrow.year())
                .month(indiaTomorrow.month())
                .date(indiaTomorrow.date());

            booking.recurrence.range.startDate.iso = originalDate.toISOString();

            console.log("Updated ISO:", booking.recurrence.range.startDate.iso);

            try {
                const response = await axios.post(url, booking, {
                    headers: {
                        "X-Parse-Application-Id": booking._ApplicationId,
                        "X-Parse-JavaScript-Key": booking._JavaScriptKey,
                        "X-Parse-Session-Token": booking._SessionToken,
                        "Content-Type": "application/json",
                    },
                });

                results.push({
                    user: booking.assignedTo.name,
                    status: "Success",
                    response: response.data,
                });

            } catch (error) {
                results.push({
                    user: booking.assignedTo.name,
                    status: "Failed",
                    error: error.response?.data || error.message,
                });
            }
        }

    } catch (err) {
        return { error: "❌ Error reading or parsing JSON", details: err.message };
    }

    return results;
}


// async function sendBookings() {
//     try {
//         const jsonString = fs.readFileSync(seatbookjson, "utf8");
//         const seatbook_list = JSON.parse(jsonString);

//         // Get current India date + 1 day using moment
//         //const indiaTomorrow = moment().tz("Asia/Kolkata").add(1, "day");
//         const indiaTomorrow = moment().tz("Asia/Kolkata");

//         console.log("Tomorrow India Time:", indiaTomorrow.format());

//         for (let i = 0; i < seatbook_list.length; i++) {
//             const booking = seatbook_list[i];
//             console.log(`📌 Sending booking for ${i + 1} for ${booking.assignedTo.name}`);

//             // Read original ISO & extract only time part
//             const originalDate = moment(booking.recurrence.range.startDate.iso);

//             // Apply tomorrow's DATE but KEEP original TIME
//             originalDate
//                 .year(indiaTomorrow.year())
//                 .month(indiaTomorrow.month())
//                 .date(indiaTomorrow.date());

//             // Convert to UTC ISO string for server
//             booking.recurrence.range.startDate.iso = originalDate.toISOString();

//             console.log("Updated ISO:", booking.recurrence.range.startDate.iso);

//             try {
//                 const response = await axios.post(url, booking, {
//                     headers: {
//                         "X-Parse-Application-Id": booking._ApplicationId,
//                         "X-Parse-JavaScript-Key": booking._JavaScriptKey,
//                         "X-Parse-Session-Token": booking._SessionToken,
//                         "Content-Type": "application/json",
//                     },
//                 });

//                 console.log(`✔ Success:`, response.data);
//             } catch (error) {
//                 console.log(`❌ Failed (${booking.assignedTo.name}):`);
//                 console.log(error.response?.data || error.message);
//             }

//             console.log("----------------------------------------");
//         }

//     } catch (err) {
//         console.error("❌ Error reading or parsing file:", err);
//     }
// }


// 🔹 SCHEDULE FOR MIDNIGHT: `0 1 0 * * *` → 12:01 AM every day
//  cron.schedule("0 1 0 * * *", () => {
//      console.log("⏰ Running scheduled task at: ", new Date().toLocaleString());
//      sendBookings();
//  });

cron.schedule("0 1 0 * * *", () => {
    console.log("⏰ Running scheduled task at (IST): ", 
        moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss")
    );

    sendBookings();
}, {
    timezone: "Asia/Kolkata"
});
// cron.schedule("* * * * *", () => {
//     console.log("⏰ Running every 1 minute:", new Date().toLocaleString());
//     sendBookings();
// });


//Send Mail to Users
async function sendMail() {
  try {
    // Create reusable SMTP connection
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "neeraj.login@gmail.com",
        pass: "nozn nwrj skbj gviw" // NOT normal password
      }
    });

    // Email details
    const mailOptions = {
      from: "neeraj.login@gmail.com",
      to: "neeraj.login@gmail.com",
      subject: "Test Email from Node.js",
      text: "Hello! This is a test message.",
      html: "<h3>Hello!</h3><p>This is a <b>test email</b>.</p>"
    };

    // Send mail
    const info = await transporter.sendMail(mailOptions);
    
    console.log("✔ Email sent:", info.response);

  } catch (error) {
    console.log("❌ Error sending email:", error);
  }
}

cron.schedule("*/5 * * * *", () => {
    console.log("📩 Sending mail every 5 minutes...");
    sendMail();
});


cron.schedule("*/30 * * * *", () => {
    console.log("📩 Sending mail every 30 minutes...");
    sendMail();
}, {
    timezone: "Asia/Kolkata"
});


// Task to run repeatedly
// function runTask() {
//     console.log("⏰ Task executed at:", new Date().toLocaleString());
// }
// // Run every 10 seconds
// setInterval(runTask, 10000);

// app.listen(port, () => {
//   `Server started on port ${port}`;
// });

//module.exports = app;

app.listen(port, () => {
  `Server started on port ${port}`;
});