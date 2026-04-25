# MERAKI CARE - User Guide
## Hospital Billing Management System

---

## Table of Contents
1. [System Overview](#system-overview)
2. [Getting Started](#getting-started)
3. [Admin Guide](#admin-guide)
4. [Staff Guide](#staff-guide)
5. [Common Tasks](#common-tasks)
6. [Troubleshooting](#troubleshooting)

---

## System Overview

Meraki Care is a comprehensive hospital billing management system designed to streamline patient billing, invoice generation, and administrative operations. The system supports multiple user roles with different permission levels.

### Key Features
- **Patient Billing**: Create and manage patient invoices
- **Bill Management**: View, download, and archive previously saved bills
- **Settings Management**: Configure hospital details, staff, doctors, medicines, and tests
- **Multi-Device Support**: Fully responsive design works on desktop, tablet, and mobile devices
- **GST Compliance**: Automatic GST calculation and invoice generation

### System Requirements
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection
- Login credentials provided by administrator

---

## Getting Started

### Login
1. Navigate to the Meraki Care application
2. Enter your email address
3. Enter your password
4. Click "Login" button
5. If login fails, click "Forgot Password?" to reset your credentials

### Navigation
The application contains two main sections:
- **Billing**: Create new bills and manage saved invoices
- **Settings**: Configure hospital information and manage catalogs (Admin only)

---

## Admin Guide

### Accessing Settings
1. Click on the "Settings" option in the sidebar/navigation menu
2. You will see multiple tabs for different configurations

### 1. Hospital Settings Tab

**Purpose**: Configure your hospital's information that appears on all invoices

**Steps**:
1. Click the "Hospital" tab in settings
2. Fill in the following information:
   - **Hospital Name**: Your hospital's official name
   - **Address**: Complete hospital address
   - **Phone**: Main contact number
   - **Email**: Hospital email address
   - **GST Identification Number (GSTIN)**: Your 15-digit GST number

3. Click "Save" to apply changes
4. This information will automatically appear on all generated invoices

### 2. GST Settings Tab

**Purpose**: Configure GST rates for automatic tax calculations

**Steps**:
1. Click the "GST" tab
2. Enter the **GST Percentage** (e.g., 5, 12, 18)
3. Click "Save"
4. This rate will be automatically applied to all new bills

### 3. Doctors Management Tab

**Purpose**: Maintain a list of doctors who will be assigned to patient bills

**Adding a Doctor**:
1. Click the "Doctors" tab
2. Under "Add Doctor" section:
   - Enter **Doctor Name** (full name)
   - Enter **Specialization** (e.g., Cardiologist, General Physician)
   - Enter **License Number** (medical license/registration number)
   - Click "Add" button

3. Doctor will appear in the list below

**Removing a Doctor**:
1. Find the doctor in the list
2. Click the "Delete" button (trash icon)
3. Confirm deletion

### 4. Medicines Catalog Tab

**Purpose**: Build a catalog of medicines available in your hospital

**Adding a Medicine**:
1. Click the "Medicines" tab
2. Under "Add Medicine" section:
   - Enter **Medicine Name** (brand or generic name)
   - Enter **Unit Price** (price per unit)
   - Click "Add" button

3. Medicine will appear in the catalog

**Editing a Medicine**:
1. Find the medicine in the list
2. Click on the name or price to edit inline
3. Make changes and press Enter to save
4. Press Escape to cancel

**Removing a Medicine**:
1. Find the medicine in the list
2. Click the "Delete" button
3. Confirm deletion

### 5. Tests Catalog Tab

**Purpose**: Manage medical tests and diagnostic procedures available

**Adding a Test**:
1. Click the "Tests" tab
2. Under "Add Test" section:
   - Enter **Test Name** (e.g., Blood Test, X-Ray)
   - Enter **Test Price** (cost of the test)
   - Click "Add" button

3. Test will appear in the catalog

**Editing a Test**:
1. Find the test in the list
2. Click on the name or price to edit inline
3. Make changes and press Enter to save

**Removing a Test**:
1. Find the test in the list
2. Click the "Delete" button
3. Confirm deletion

### 6. Staff Management Tab

**Purpose**: Manage hospital staff members and their access

**Adding Staff**:
1. Click the "Staff" tab
2. Under "Add Staff" section:
   - Enter **Staff Name**
   - Enter **Email Address**
   - Select **Role** (dropdown)
   - Enter **Department**
   - Click "Add" button

3. Staff member will be added to the system

**Removing Staff**:
1. Find the staff member in the list
2. Click the "Delete" button
3. Confirm deletion

### Mobile Optimization Tips
- On smaller screens, tabs are abbreviated (Dr for Doctors, Med for Medicines)
- Use horizontal scrolling to view full tab names if needed
- Forms automatically stack vertically on mobile devices
- All buttons and inputs are sized for easy touch interaction

---

## Staff Guide

### Accessing Billing
1. Click on the "Billing" option in the sidebar/navigation menu
2. You will see two tabs: "Create Bill" and "Saved Bills"

### 1. Creating a New Bill

#### Patient Information Section
1. Click the "Create Bill" tab (if not already selected)
2. Fill in patient details:
   - **Patient Name**: Full name of the patient
   - **Patient Phone**: Contact number
   - **Patient Age**: Age in years
   - **Patient Gender**: Select from dropdown (Male/Female/Other)
   - **Patient Address**: Complete address
   - **Assigned Doctor**: Select from dropdown (list populated from admin settings)

#### Adding Medicines
1. Scroll to the "Medicines" section
2. Click "Add Medicine" button
3. For each medicine entry:
   - **Select Medicine**: Choose from the medicine catalog
   - **Quantity**: Number of units
   - Unit price will auto-populate
   - Amount will calculate automatically (Quantity × Unit Price)

4. To remove a medicine row, click the "Delete" button on that row
5. Total for medicines shows in the summary

#### Adding Tests
1. Scroll to the "Tests" section
2. Click "Add Test" button
3. For each test entry:
   - **Select Test**: Choose from the test catalog
   - **Quantity**: Usually 1, but can be more for multiple instances
   - Unit price will auto-populate
   - Amount will calculate automatically

4. To remove a test row, click the "Delete" button
5. Total for tests shows in the summary

#### Bill Summary
On the right sidebar (desktop) or below form (mobile):
- **Subtotal**: Sum of all medicines and tests
- **GST (%)**: Shows applied GST percentage
- **GST Amount**: Calculated tax amount
- **Total**: Final bill amount (Subtotal + GST Amount)

#### Saving the Bill
1. Review all entered information
2. Click "Preview Bill" button
3. A preview dialog will show exactly how the bill will appear
4. Verify all details are correct
5. Click "Save Bill" button in the preview
6. Bill will be saved to database
7. You will receive a confirmation message

### 2. Viewing Saved Bills

#### Accessing Saved Bills
1. Click the "Saved Bills" tab
2. You will see a grid of all bills created previously

#### Bill Card Information
Each bill card displays:
- **Patient Name**
- **Total Amount**
- **Date Created**
- **Two Action Buttons**:
  - **View**: Opens the bill in a preview dialog
  - **Download**: Downloads the bill as a PDF file

#### Viewing a Bill
1. On a saved bill card, click the "View" button
2. A dialog will open showing the complete bill layout
3. Review the bill details
4. Click "Close" to close the dialog or "Download PDF" to save the bill

#### Downloading a Bill
1. On a saved bill card, click the "Download" button
2. OR: Click "View" to open the bill, then click "Download PDF"
3. The bill will be downloaded as a PDF file to your device
4. File name format: `bill-{invoice-number}.pdf`

### Mobile Optimization Tips
- **Create Bill Tab**: 
  - Form inputs stack vertically
  - Summary sidebar appears below form on mobile
  - Large touch-friendly buttons
  - Clear section dividers

- **Saved Bills Tab**:
  - Bills display in single column on mobile
  - Full-width cards for easy reading
  - Buttons are large enough for easy tapping
  - Horizontal scroll for larger screens

---

## Common Tasks

### Task 1: Set Up Hospital for First Time
**Time Required**: 10-15 minutes

**Steps**:
1. Login as admin
2. Go to Settings → Hospital tab
3. Enter all hospital information
4. Go to Settings → GST tab, enter your GST rate
5. Go to Settings → Doctors tab, add all doctors
6. Go to Settings → Medicines tab, add common medicines
7. Go to Settings → Tests tab, add available tests
8. Go to Settings → Staff tab, add all staff members

**Result**: System is configured and ready for billing

### Task 2: Create Your First Patient Bill
**Time Required**: 5-10 minutes

**Steps**:
1. Login as staff
2. Go to Billing → Create Bill tab
3. Enter patient information
4. Add medicines/tests as needed
5. Click "Preview Bill"
6. Review and click "Save Bill"
7. Bill appears in "Saved Bills" tab

**Result**: Bill is saved and can be viewed/downloaded anytime

### Task 3: Generate Report for Specific Bill
**Time Required**: 2-3 minutes

**Steps**:
1. Go to Billing → Saved Bills tab
2. Find the bill you need
3. Click "Download" to get PDF
4. Save to your computer
5. Print or share as needed

**Result**: PDF copy of bill is available on your device

### Task 4: Update Medicine Prices
**Time Required**: 3-5 minutes

**Steps**:
1. Login as admin
2. Go to Settings → Medicines tab
3. Find the medicine to update
4. Click on the price value to edit
5. Enter new price
6. Press Enter to save
7. Future bills will use new price

**Result**: Medicine prices are updated

---

## Troubleshooting

### Issue: Cannot Login
**Problem**: Login screen shows error

**Solutions**:
1. Verify email address is correct (case-insensitive)
2. Verify password is correct (case-sensitive)
3. Click "Forgot Password?" to reset password
4. Check internet connection
5. Try a different browser
6. Clear browser cache and cookies

**Still not working?**: Contact system administrator

---

### Issue: Cannot Find Medicine/Test in Dropdown
**Problem**: Medicines or tests don't appear when creating a bill

**Cause**: They haven't been added to the catalog

**Solution**:
1. Ask admin to add the medicine/test to Settings
2. Admin goes to Settings → Medicines/Tests tab
3. Admin clicks "Add" and enters details
4. New items will appear in billing form immediately

---

### Issue: Bill Not Saving
**Problem**: "Save Bill" button doesn't work or shows error

**Solutions**:
1. Verify all required fields are filled (check for red borders)
2. Verify at least one medicine or test is added
3. Check internet connection
4. Try refreshing the page (Ctrl+R or Cmd+R)
5. Make sure you're not using an outdated browser

**Error message shows?**: Contact administrator with the error message

---

### Issue: Cannot View Saved Bill
**Problem**: "View" button shows loading but no bill appears

**Solutions**:
1. Check internet connection
2. Wait a few seconds (may be loading)
3. Try again in a different tab/window
4. Refresh the page
5. Log out and log back in

---

### Issue: Downloaded PDF Appears Empty
**Problem**: Bill PDF downloaded but contains no information

**Solutions**:
1. Wait a moment before clicking download again
2. Try a different browser
3. Check if hospital information is filled in Settings
4. Ask admin to verify hospital settings are complete

---

### Issue: Form Fields Display Incorrectly on Mobile
**Problem**: Text or buttons appear cut off or overlapped on mobile

**Solutions**:
1. Rotate device from portrait to landscape mode
2. Use the latest version of your browser
3. Close other tabs to free up resources
4. Clear browser cache

---

## Best Practices

### For Admins
1. **Regular Backups**: Periodically export your bill data
2. **Keep Catalogs Updated**: Regularly update medicine and test prices
3. **Monitor Staff Access**: Review staff access periodically
4. **Update Hospital Info**: Keep hospital details current for invoices
5. **GST Changes**: Update GST rate immediately when government rates change

### For Staff
1. **Verify Patient Info**: Double-check patient details before saving
2. **Use Correct Doctor**: Assign the right doctor to the bill
3. **Accurate Quantities**: Enter correct quantities for medicines/tests
4. **Save Frequently**: Don't keep bills in draft mode too long
5. **Download Backup**: Always download important bills as PDF

### General
1. **Use Latest Browser**: Keep your browser updated for best performance
2. **Stable Internet**: Ensure good internet connection before creating bills
3. **Regular Backups**: Backup your important bills regularly
4. **Security**: Never share login credentials
5. **Report Issues**: Immediately report any errors or issues

---

## FAQ

**Q: Can I edit a bill after saving?**
A: Currently, bills are final once saved. To make changes, contact your administrator.

**Q: Can I delete a saved bill?**
A: Bills are permanent records. Contact administrator if deletion is needed.

**Q: How do I change my password?**
A: Use "Forgot Password?" on the login page to reset your password.

**Q: Can I use this on my phone?**
A: Yes, the system is fully responsive and works on mobile devices.

**Q: How do I print a bill?**
A: Download the bill as PDF, then use your system's print function.

**Q: Can multiple people work simultaneously?**
A: Yes, the system supports multiple users at the same time.

**Q: Is my data secure?**
A: Yes, all data is encrypted and stored securely in our database.

---

## Support

For technical support or questions not covered in this guide:

1. **Contact System Administrator**
   - Email: admin@merakicare.com
   - Phone: [Hospital Number]

2. **Report Issues**
   - Describe what you were doing
   - Include any error messages
   - Note the date and time of the issue

3. **Feedback**
   - We welcome your suggestions for improvement
   - Contact support team with your ideas

---

**Document Version**: 1.0
**Last Updated**: April 2026
**Meraki Care Team**
