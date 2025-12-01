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

app.get("/", (req, res) => {
  res.send("Subscribe to My channel Vista by NG");
  console.log("⏰ Task executed at Subscribe to My channel Vista:", new Date().toLocaleString());
});



// async function sendBookings() {
//     try {
//         const jsonString = fs.readFileSync(seatbookjson, "utf8");
//         const seatbook_list = JSON.parse(jsonString);
        
//         // Get current India time
//         const indiaTime = moment().tz("Asia/Kolkata");

//         // Add 1 day if needed
//         const indiaTimePlusOneDay = indiaTime.add(1, "day");

//         // Convert to ISO format
//         const isoDate = indiaTimePlusOneDay.toISOString();

//         console.log(isoDate);


//         for (let i = 0; i < seatbook_list.length; i++) {
//             const booking = seatbook_list[i];
//             console.log(`📌 Sending booking ${i + 1} for ${booking.assignedTo.name}`);

//             let iso = booking.recurrence.range.startDate.iso;

//             // Convert original ISO to Date object
//             let originalDate = new Date(iso);            

//             // Add 1 day (UTC safe)
//             //originalDate.setUTCDate(originalDate.getUTCDate() + 1);

//             // Get current date (UTC)
//             //let now = new Date();
//             let now = moment().tz("Asia/Kolkata");            

//             // Add 1 day
//             //now.setUTCDate(now.getUTCDate() + 1);


//             // Update only the date parts
//             originalDate.setUTCFullYear(now.getUTCFullYear());
//             originalDate.setUTCMonth(now.getUTCMonth());
//             originalDate.setUTCDate(now.getUTCDate());

//             // Save back to JSON in UTC format
//             booking.recurrence.range.startDate.iso = originalDate.toISOString();

//             console.log(booking.recurrence.range.startDate.iso);


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
// cron.schedule("0 1 0 * * *", () => {
//     console.log("⏰ Running scheduled task at: ", new Date().toLocaleString());
//     sendBookings();
// });

// 🔹 SCHEDULE FOR EVER MINUTE 

async function sendBookings() {
    try {
        const jsonString = fs.readFileSync(seatbookjson, "utf8");
        const seatbook_list = JSON.parse(jsonString);

        // Get current India date + 1 day using moment
        //const indiaTomorrow = moment().tz("Asia/Kolkata").add(1, "day");
        const indiaTomorrow = moment().tz("Asia/Kolkata");

        console.log("Tomorrow India Time:", indiaTomorrow.format());

        for (let i = 0; i < seatbook_list.length; i++) {
            const booking = seatbook_list[i];
            console.log(`📌 Sending booking for ${i + 1} for ${booking.assignedTo.name}`);

            // Read original ISO & extract only time part
            const originalDate = moment(booking.recurrence.range.startDate.iso);

            // Apply tomorrow's DATE but KEEP original TIME
            originalDate
                .year(indiaTomorrow.year())
                .month(indiaTomorrow.month())
                .date(indiaTomorrow.date());

            // Convert to UTC ISO string for server
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

                console.log(`✔ Success:`, response.data);
            } catch (error) {
                console.log(`❌ Failed (${booking.assignedTo.name}):`);
                console.log(error.response?.data || error.message);
            }

            console.log("----------------------------------------");
        }

    } catch (err) {
        console.error("❌ Error reading or parsing file:", err);
    }
}


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
function runTask() {
    console.log("⏰ Task executed at:", new Date().toLocaleString());
}

// Run every 10 seconds
setInterval(runTask, 10000);


app.listen(port, () => {
  `Server started on port ${port}`;
});
