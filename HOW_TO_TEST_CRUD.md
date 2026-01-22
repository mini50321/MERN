# How to Test CRUD Operations - Step by Step Guide

## Prerequisites
✅ Make sure both servers are running:
- Backend: `cd backend && npm run dev` (should show "Server running on port 3000")
- Frontend: `cd frontend && npm run dev` (should show "Local: http://localhost:5173")
- MongoDB: Should be connected (check backend terminal for "MongoDB connected successfully")

---

## Test 1: CREATE - Book a Service (Patient Side)

### Step-by-Step:

1. **Open your browser:** Go to `http://localhost:5173`

2. **Log in:**
   - Click "Get Started" button
   - Enter your phone number (10 digits, starting with 6-9)
   - Click "Send OTP"
   - Check your backend terminal for the OTP code
   - Enter the OTP and click "Verify & Login"

3. **Navigate to Services:**
   - After login, you'll be on the home page
   - Look for "Services" in the navigation menu (top or sidebar)
   - OR go directly to: `http://localhost:5173/services`

4. **Book a Service:**
   - On the Services page, you'll see service cards (Physiotherapy, Nursing Care, Ambulance, Medical Equipment)
   - Click on any service card (e.g., "Physiotherapy" or "Nursing Care")
   - A booking modal will open

5. **Fill in the booking form:**
   - **Patient Name:** Enter "Test Patient"
   - **Phone:** Your phone number (already filled if logged in)
   - **Email:** test@example.com (optional)
   - **Address:** "123 Test Street"
   - **City:** "Mumbai"
   - **State:** "Maharashtra"
   - **Pincode:** "400001"
   - **Preferred Date:** Select a future date
   - **Preferred Time:** Select any time
   - **Issue Description:** "Test booking for CRUD operations"
   - Click "Submit" or "Book Service"

6. **Verify it was created:**
   - You should see a success message
   - The modal should close
   - Navigate to "My Bookings" or "Patient Dashboard" to see your booking
   - OR go to: `http://localhost:5173/patient-dashboard`

**✅ Success:** If you see your booking in the list, CREATE operation works!

---

## Test 2: CREATE - Add a Product (Business Side)

**Note:** This requires a business account. If you don't have one, you can:
- Complete onboarding and select "Business" account type
- OR test this after setting up business account

### Step-by-Step:

1. **Make sure you're logged in** (same as Test 1)

2. **Navigate to Business Dashboard:**
   - Go to: `http://localhost:5173/business-dashboard`
   - OR click "Business Dashboard" in navigation

3. **Go to Products Tab:**
   - In the Business Dashboard, click on "Products" tab (if not already selected)

4. **Add a Product:**
   - Look for "Quick Add" button (usually top right)
   - Click "Quick Add" or "+" button
   - A modal will open

5. **Fill in product details:**
   - **Product Name:** "Test Product"
   - **Description:** "This is a test product for CRUD testing"
   - **Category:** "Medical Equipment" (or any category)
   - **Manufacturer:** "Test Manufacturer"
   - **Model Number:** "TEST-123"
   - **Customer Price:** 5000
   - **Currency:** INR
   - Click "Save Product"

6. **Verify it was created:**
   - You should see a success message
   - The product should appear in your products list
   - The modal should close

**✅ Success:** If you see your product in the list, CREATE operation works!

---

## Test 3: READ - View Your Records

### View Bookings:

1. **Go to Patient Dashboard:**
   - Navigate to: `http://localhost:5173/patient-dashboard`
   - OR click "Patient Dashboard" in navigation

2. **Check Bookings Section:**
   - You should see your booking from Test 1
   - It should show: Patient name, service type, date, status

**✅ Success:** If you can see your booking details, READ operation works!

### View Products:

1. **Go to Business Dashboard:**
   - Navigate to: `http://localhost:5173/business-dashboard`
   - Click "Products" tab

2. **Check Products List:**
   - You should see your product from Test 2
   - It should show: Product name, description, price

**✅ Success:** If you can see your product details, READ operation works!

---

## Test 4: UPDATE - Edit a Record

### Edit a Booking:

1. **Go to Patient Dashboard:**
   - Navigate to: `http://localhost:5173/patient-dashboard`
   - Find your booking from Test 1

2. **Click Edit:**
   - Look for "Edit" button or icon on the booking card
   - Click it (if available)

3. **Modify details:**
   - Change the address to "456 Updated Street"
   - Change the preferred date
   - Click "Save" or "Update"

4. **Verify changes:**
   - Check if the updated information appears in the booking

**✅ Success:** If changes are saved and visible, UPDATE operation works!

### Edit a Product:

1. **Go to Business Dashboard:**
   - Navigate to: `http://localhost:5173/business-dashboard`
   - Go to "Products" tab
   - Find your product from Test 2

2. **Click Edit:**
   - Click on the product card or "Edit" button
   - A modal will open with current details

3. **Modify details:**
   - Change the price to 6000
   - Change the description
   - Click "Save Product"

4. **Verify changes:**
   - Check if the updated information appears

**✅ Success:** If changes are saved and visible, UPDATE operation works!

---

## Test 5: DELETE - Remove a Record

### Delete a Booking:

1. **Go to Patient Dashboard:**
   - Navigate to: `http://localhost:5173/patient-dashboard`
   - Find your booking

2. **Click Delete:**
   - Look for "Delete" button or trash icon
   - Click it
   - Confirm deletion if asked

3. **Verify deletion:**
   - The booking should disappear from the list
   - Refresh the page - it should still be gone

**✅ Success:** If the booking is removed, DELETE operation works!

### Delete a Product:

1. **Go to Business Dashboard:**
   - Navigate to: `http://localhost:5173/business-dashboard`
   - Go to "Products" tab
   - Find your product

2. **Click Delete:**
   - Look for "Delete" button or trash icon
   - Click it
   - Confirm deletion if asked

3. **Verify deletion:**
   - The product should disappear from the list
   - Refresh the page - it should still be gone

**✅ Success:** If the product is removed, DELETE operation works!

---

## Test 6: View Analytics/Reports (Admin Dashboard)

**Note:** This requires admin access. If you don't have admin account, you can skip this or set one up.

### Step-by-Step:

1. **Navigate to Admin Dashboard:**
   - Go to: `http://localhost:5173/admin/dashboard`
   - OR click "Admin Dashboard" in navigation

2. **Check Analytics Section:**
   - Look for "Analytics" or "Reports" tab
   - You should see:
     - Total users
     - Total bookings
     - Recent activity
     - Charts/graphs

3. **Verify data loads:**
   - Check if numbers appear (even if 0)
   - Check if charts render
   - No errors in browser console

**✅ Success:** If analytics data loads without errors, Reporting works!

---

## Troubleshooting

### If you can't find a page:
- Check the URL in browser address bar
- Look for navigation menu items
- Try typing the URL directly (e.g., `/patient-dashboard`)

### If forms don't submit:
- Check browser console for errors (F12 → Console tab)
- Check backend terminal for errors
- Make sure you're logged in (check for cookie)

### If data doesn't appear:
- Check if MongoDB is connected (backend terminal should show "MongoDB connected successfully")
- Refresh the page
- Check browser console for API errors

### If you get 401 Unauthorized:
- You're not logged in - log in again
- Clear browser cookies and log in again

---

## What to Check After Testing

After completing all tests, verify:

✅ **CREATE:** Can create bookings and products  
✅ **READ:** Can view created records  
✅ **UPDATE:** Can edit and save changes  
✅ **DELETE:** Can remove records  
✅ **REPORTS:** Can view analytics (if admin)

If all tests pass, CRUD operations are working correctly! 🎉

---

## Next Steps

Once CRUD testing is complete:
1. Move to MongoDB Atlas setup (for production)
2. Set up Git repository
3. Deploy to Hostinger

See `NEXT_STEPS.md` for detailed deployment guide.

