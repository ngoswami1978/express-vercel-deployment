import moment from "moment-timezone";

export default async function handler(req, res) {
  console.log("🔥 Auto booking triggered at:", moment().tz("Asia/Kolkata").format());

  // Call your main booking function here
  // await sendBookings();

  res.status(200).json({
    success: true,
    message: "Booking triggered successfully",
    time: moment().tz("Asia/Kolkata").format(),
  });
}
