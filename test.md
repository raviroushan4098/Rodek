# MetricStack Architecture Migration — E2E Test Plan

This document outlines the step-by-step test cases to verify all features and role-based access controls in the newly migrated React + Node.js/Express + Firebase architecture.

---

## 🔐 1. Authentication & Security
### 1.1 Super Admin Login
- Navigate to `/login`
- Login with super admin credentials (`admin@gmail.com ,pass:- Admin@1122`).
- Verify successful redirect to Dashboard.
- Verify the sidebar shows "Locations", "Users", and "Settings".

### 1.2 Admin Login
- Login with a standard admin account.
- Verify the sidebar **hides** "Locations", "Users", and "Settings" entirely.
- Attempt to manually navigate to `/users` via the URL bar. Verify it blocks access and redirects to Dashboard or shows "Access Denied".

### 1.3 Invalid Login
- Attempt to login with an invalid email or password.
- Verify a clear error message (Toast notification) is displayed.

---

## 📊 2. Dashboard Hub
### 2.1 Super Admin View
- Ensure stats (Total Revenue, Active Rentals, Total Cars) represent **all locations** combined.
- Verify "Maintenance Cars" list shows 3 cars currently in maintenance globally.

### 2.2 Location Admin View
- Login as an admin assigned to a specific location (e.g., "LAW GATE").
- Verify the **Location Badge** appears in the top navigation bar.
- Verify Total Cars, Revenue, and Active Rentals represent **only** vehicles tracked to your location.
- Verify "Recent Bookings" shows bookings done by you AND other admins at your location.

---

## 🚘 3. Fleet Management (Cars)
### 3.1 Create Car
- Go to `/cars` -> Click "Add New Vehicle".
- Upload an Image (verify Firebase Storage integration).
- Fill out Make, Model, Plate, Daily Rate, Seat Capacity, Transmission, Fuel.
- Verify the car's initial status defaults to **Available**.
- Ensure the car is tied to the logged-in admin's location.

### 3.2 List Cars
- Verify you can see your cars.
- Ensure the search and sorting UI filters correctly.
- Ensure the **Added By** column displays the creator's name.

### 3.3 Car Detail View
- Click on a car row.
- Verify the prominent **Book Now** button is active if the status is "Available".
- Note the **Upcoming Reservations** panel is empty for brand-new cars.
- Test changing the car status manually to *Maintenance* and verifying it updates on the dashboard.

---

## 👥 4. Customer Management
### 4.1 Create Customer
- Go to `/customers` -> "Add Customer".
- Upload a profile picture (optional).
- Add Aadhar Card / Driver's License scans (verify multi-file storage if applicable/tested).
- Ensure the customer saves successfully.

### 4.2 Customer 360 Analytics View
- Click on the newly created customer.
- Verify the profile page loads the Trust Score, Lifetime Value, Total Rentals, and Recent Rentals graph/table.

---

## 📅 5. Bookings & Reservations
### 5.1 Simple Active Rental
- Go to `/bookings/new`.
- Select a Customer and a Car (Car status must be *Available*).
- Set Start Date to **Today** and an End Date a few days out.
- Set an Advance Payment (e.g., 2000 INR).
- **Submit**: Verify the Car Status immediately changes to **Rented**.

### 5.2 Advance Booking (Future Start Date)
- Navigate to a car that is currently *Rented* (or *Available*).
- From the Car Detail page, click **Book Now**.
- Observe the Car dropdown is locked to that specific car.
- Select a **Future Date** (e.g., next month).
- **Submit**: Verify the Booking status is **Pending** and the Car Status remains what it was previously (Available or Rented).
- Verify the Advance Booking appears in the **Upcoming Reservations** panel on the Car's Detail page.

### 5.3 Double-Booking Prevention (Conflict Checking)
- Go to `/bookings/new`.
- Attempt to book the exact same car you just booked for dates that overlap with the previous active/advance booking.
- **Submit**: Expect a beautiful centered modal popup (Warning Icon) stating **"Car is Already Booked"**.
- Verify the popup displays the exact conflicting dates and the **Admin Contact Name** of whoever made that booking.

### 5.4 Booking Closure / Return
- Go to a current Active Booking (`/bookings`).
- Edit the booking -> Add "Actual End Date/Time" -> Change Status to **Completed**.
- If there's vehicle damage, toggle "Incident Reported" and add notes.
- **Submit**: Check the Car's Detail page. Its status should automatically flip back to **Available**.
- The customer's Trust Score should decrease if returned late or damaged.

---

## 💳 6. Payments Tracking
### 6.1 Recording a Payment
- After closing a booking that had a remaining balance, go to `/payments/new`.
- Select the Customer, the Booking, and enter the remaining payment amount.
- **Submit**.
- Go to the Booking Detail View and confirm the "Paid Amount" matches the total cost, and the "Payment Status" reads **Fully Paid**.

---

## ⚙️ 7. Super Admin Controls
### 7.1 Location Management
- As a Super Admin, go to `/locations`.
- Create a new "City Center" location.

### 7.2 User (Staff) Management
- Go to `/users`.
- Create a new User, assign them the role of "Admin" and map them to the "City Center" location.
- Log out, and log in as the newly created Admin to verify the location lock.

### 7.3 Settings (Config)
- Navigate to `/settings` and verify you can update GST percentages and Late Fee modifiers that take effect system-wide.

---

## 🛠️ End-of-Day Checklist Checks
1. No console errors (`F12` Developer Tools) during any CRUD operation.
2. Form validations behave accurately (blocking empty required inputs).
3. Data perfectly isolated across standard Admins.
4. Images load correctly from Firebase Storage.
