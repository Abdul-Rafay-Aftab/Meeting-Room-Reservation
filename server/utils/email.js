// Simplified email utility that logs emails instead of sending them
// This avoids SMTP configuration issues during development

const sendReservationConfirmation = async (reservation, user, room) => {
  console.log('📧 EMAIL: Reservation Confirmation');
  console.log(`To: ${user.email}`);
  console.log(`Subject: Meeting Room Reservation Confirmed`);
  console.log(`Room: ${room.name}`);
  console.log(`Date: ${new Date(reservation.start_time).toLocaleDateString()}`);
  console.log(`Time: ${new Date(reservation.start_time).toLocaleTimeString()} - ${new Date(reservation.end_time).toLocaleTimeString()}`);
  console.log('---');
};

const sendReservationCancellation = async (reservation, user, room) => {
  console.log('📧 EMAIL: Reservation Cancellation');
  console.log(`To: ${user.email}`);
  console.log(`Subject: Meeting Room Reservation Cancelled`);
  console.log(`Room: ${room.name}`);
  console.log(`Date: ${new Date(reservation.start_time).toLocaleDateString()}`);
  console.log('---');
};

const sendReservationUpdate = async (reservation, user, room) => {
  console.log('📧 EMAIL: Reservation Update');
  console.log(`To: ${user.email}`);
  console.log(`Subject: Meeting Room Reservation Updated`);
  console.log(`Room: ${room.name}`);
  console.log(`Date: ${new Date(reservation.start_time).toLocaleDateString()}`);
  console.log(`Time: ${new Date(reservation.start_time).toLocaleTimeString()} - ${new Date(reservation.end_time).toLocaleTimeString()}`);
  console.log('---');
};

module.exports = {
  sendReservationConfirmation,
  sendReservationCancellation,
  sendReservationUpdate
}; 