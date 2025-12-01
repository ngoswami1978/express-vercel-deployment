// api/autoBookSeats.js
import moment from "moment-timezone";
//import sendBookings from "../lib/sendBookings.js"; // your logic file

export default async function autoBookSeatsHandler(req, res) {
  console.log("🔥 Auto booking triggered at:", moment().tz("Asia/Kolkata").format());

  //await sendBookings();

  res.status(200).json({ success: true });
}
