# Bondhon'17 - Cooperative Management System (A-to-Z Features)

Welcome to your complete guide for the Bondhon'17 Cooperative Management System. This document details every feature and functionality available to both general members and administrators.

---

## 🚀 Core Technologies

-   **Framework**: **Next.js 14** (App Router)
-   **Language**: **TypeScript**
-   **Database**: **MongoDB**
-   **ORM**: **Prisma**
-   **Authentication**: **Clerk** for secure user sign-in, sign-up, and management.
-   **UI**: **ShadCN UI** & **Tailwind CSS** for a modern, responsive interface.
-   **File Storage**: **Cloudinary** for secure image and document uploads.
-   **Email Service**: **Resend** for sending transactional emails and notifications.
-   **Form Handling**: **React Hook Form** with **Zod** for validation.

---

## ✅ For Members: A Complete Financial Hub

This section covers all features available to a logged-in, approved member of the cooperative.

### 1. 📝 Member Registration

The foundation of the system is a comprehensive registration form that captures all necessary member details. The form is divided into sections:

-   **Joining Type**: Members choose if they are a "New Member" (dues start from the current year) or an "Old Member" (dues are back-dated to August 2025).
-   **Personal Information**:
    -   Full Name (Bangla & English)
    -   Father's Name
    -   Mother's Name
    -   NID / Birth Certificate Number
    -   Date of Birth
    -   Blood Group
    -   Marital Status
    -   Religion
-   **Address**:
    -   Current Address
    -   Permanent Address
-   **Contact & Education**:
    -   Mobile Number (Primary & Alternate)
    -   Email Address
    -   SSC Batch
    -   Other Educational Qualifications
-   **Professional Information**:
    -   Profession
    -   Workplace Name & Address
-   **Bank Information**:
    -   Bank Name
    -   Branch
    -   Account Number
    -   Account Type (Savings/Current)
    -   Banking Method (e.g., Online, Cheque)
-   **Nominee Information**:
    -   Nominee's Name
    -   Relation to Member
    -   Nominee's Mobile Number
    -   Nominee's Address
-   **Attachments**:
    -   Passport Size Photo
    -   NID / Birth Certificate Scan
    -   Bank Account Statement/Proof (Optional)

Once submitted, the application goes to an admin for approval.

### 2. 🏠 Home & Dashboard

-   **Personalized Welcome**: Greets the logged-in user by name.
-   **Quick Actions**: Direct buttons to **My Account**, **Make Payment**, and **View Transactions**.
-   **Announcements**: A feed of the latest important notices from the administrators.
-   **Dashboard Posts**: A carousel showcasing recent posts with images.
-   **Our Goal & Policies**: An accordion-style view of the cooperative's mission, vision, and core policies.

### 3. 👤 My Account & Profile

-   **Comprehensive Profile View**: A centralized page to view all personal information submitted during registration.
-   **Profile Picture & Documents**: View your uploaded photo, NID copy, and bank statements.
-   **Profile Editing**: Members can submit a request to update any of their profile information or re-upload documents. All changes are sent to an admin for approval before taking effect.

### 4. 👥 Extra Members (Shares) Management

-   **View All Shares**: See a clear list of your primary membership and any additional "extra members" (shares) you hold, along with their status (Active, Removed, Pending Transfer).
-   **Add New Shares**: If under the admin-set limit (e.g., 3 total), you can add a new share by providing the sharer's name, NID, phone, and address.
-   **Edit Share Information**: Update the details of your existing extra members.
-   **Remove a Share**: When removing a share, you have two options:
    1.  **Convert to Advance**: The total amount paid for that share is calculated and credited to your main account's "Advance Balance", which can be used to cover future dues.
    2.  **Request Transfer**: Mark the share as "Pending Transfer". An admin can then officially transfer this share to another member.

### 5. 💳 Payments & Financials: Due, Advance & Current Control

-   **Unified Payment Page**: A single, intelligent page to handle all types of payments.
-   **Due Calculation Engine**: The page provides a real-time summary of your financial status:
    -   **Past Dues**: The total accumulated unpaid amount from previous months for all your shares.
    -   **Current Month's Savings**: The amount due for the current month for all your shares.
    -   **Advance Balance**: Any extra money you have paid, which is automatically used to offset dues.
    -   **Total Payable**: The final amount you need to pay (`Past Dues + Current Dues - Advance Balance`).
-   **Payment Types**:
    -   **Monthly Savings**: Pay your dues for past or current months. The system intelligently shows which months are due.
    -   **Loan Repayment**: Pay your loan installments.
    -   **Event Payments**: Pay for special events created by admins (e.g., Annual Picnic).
    -   **Other**: Make payments for other miscellaneous reasons.
-   **Manual Payment Verification**:
    -   Select from admin-configured payment methods (bKash, Nagad, Bank Accounts).
    -   After making the payment externally, submit the **Transaction ID** and your **Sender Number** for admin verification.
    -   The payment appears as "Pending" until an admin approves it.

### 6. 📜 Transaction History

-   **Complete Ledger**: View a full history of all your transactions, including savings, loan disbursements, loan repayments, and other payments.
-   **Transaction Status**: Each transaction is clearly marked as **Completed**, **Pending**, or **Failed**.
-   **Downloadable Receipts**: For any completed or failed transaction, you can view and print/download a detailed, computer-generated receipt.

### 7. 💰 Loan System

-   **Loan Status Dashboard**: A dedicated page showing:
    -   Your current loan status (total loaned, amount repaid, amount due).
    -   A progress bar for your loan repayment.
    -   Your maximum loanable amount, calculated based on your total savings and the cooperative's rules.
-   **Loan Application Form**: If eligible, you can apply for a new loan. The form requires:
    -   Loan Amount & Repayment Period
    -   Reason for the loan
    -   Detailed **Guarantor Information** (Name, Phone, Address, NID).
    -   Guarantor's NID copy upload.
    -   Selection of a person to repay the loan in case of the guarantor's death.
-   **Application Tracking**: After applying, the dashboard will show that your application is "Pending Review".

### 8. 📬 Notices & Inbox

-   **Public Notice Board**: A page dedicated to viewing all published announcements from the administration.
-   **Personal Inbox**: Receive private, direct messages from administrators (e.g., payment reminders, personal queries).
-   **Unread Indicators**: The header shows a notification badge for unread messages in your inbox.

---

## 🛠️ For Admins: Total System Control

This section covers all features available to users with administrative roles. Access is tiered based on role (e.g., Super Admin, Members Manager, etc.).

### 1. 📊 Admin Dashboard

-   **At-a-Glance Statistics**: A comprehensive overview of the cooperative's health:
    -   Total Members & Approved Members
    -   Total Savings Fund (Cash Available) & Total Loaned Out
    -   Monthly Paid Status (e.g., "25/30 members paid")
-   **Pending Actions**: Quick-access cards showing the number of items requiring immediate attention:
    -   Pending Member Approvals
    -   Pending Loan Requests
    -   Pending Payment Verifications
    -   Pending Profile Update Requests

### 2. 🧑‍🤝‍🧑 Member Management

-   **Full Member List**: View all members, filterable by status (Pending, Approved, Rejected, Flagged, Awaiting Submission).
-   **Member Approval Workflow**:
    -   Review a new member's full application details.
    -   **Approve**: The member gains full access to the site. An email notification is sent.
    -   **Reject**: Provide a reason for rejection. The member is notified via email and in-app message.
-   **Detailed Member View**: Drill down into any member's profile to see a complete financial summary, transaction/loan history, and all their personal details.
-   **Admin Actions**:
    -   **Edit Member**: Directly edit any detail of a member's profile.
    -   **Flag for Review**: Mark a member's account for attention.
    -   **Delete Member**: Permanently delete a member and all their associated data from the system and Clerk.
    -   **Manage Shares**: Add, edit, or remove extra members (shares) on behalf of a user.
    -   **Transfer Shares**: Securely transfer a share (and its entire financial history and past transactions) from one member to another.
    -   **Make Payment**: Record a payment on behalf of a member.

### 3. 💸 Transaction & Payment Management

-   **Payment Verification**: View all pending manual payments submitted by members.
    -   Review the Transaction ID, amount, and member details.
    -   **Approve**: The payment is marked as "Completed". The financial engine automatically allocates the funds to the member's dues (oldest first) or advance balance. An email notification is sent.
    -   **Reject**: The payment is marked as "Failed". The member is notified via email.
-   **Paid/Unpaid Status**:
    -   A dedicated page shows lists of all members who have fully paid for the current month and those who have not.
    -   **Send Reminder**: Send an email and in-app payment reminder to a single unpaid member or to all unpaid members with a single click.

### 4. 🏦 Loan Management

-   **Review Loan Applications**: View all pending loan requests with full application and guarantor details.
-   **Loan Approval Workflow**:
    -   **Approve**: The loan becomes "Active". A transaction for the loan disbursement is automatically created (deducting from the main fund), and the member is notified via email.
    -   **Reject**: The application is rejected, and the member is notified.
-   **Manual Loan Assignment**: Directly assign a loan to a member, bypassing the application process.
-   **Mark as Repaid**: Manually mark an active loan as fully "Repaid" once all installments are complete.

### 5. ✍️ Content & Communication

-   **Post Management**: Create, edit, and delete announcements and dashboard posts.
    -   **Post Types**: Choose between a "Notice" (text-focused) or a "Dashboard Post" (image-focused).
    -   **Image Uploads**: Add one or more images to any post.
    -   **Status Control**: Save posts as "Draft" or "Publish" them to make them visible to all members.
-   **Member Messaging**:
    -   Send a message to **all members** at once.
    -   Send a private, targeted message to a **specific member**.

### 6. ⚙️ Super Admin Settings

-   **Full System Configuration**: Super Admins have access to a master settings panel:
    -   **Site Details**: Site Title and Logo.
    -   **Financial Rules**: Minimum Monthly Savings, Extra Member (Share) Fee, Max Shares per Member, Loan-to-Savings Ratio.
    -   **Loan System Toggle**: Globally enable or disable the entire loan application system.
    -   **Payment Accounts**: Add or remove the bank/mobile banking accounts that members can pay into.
    -   **Policy Editor**: Directly edit the content of the official Policy page.
-   **Admin Management**: Add or remove other users as administrators and assign them specific roles (e.g., 'Loans Manager', 'Posts Manager').
-   **Event Management**: Create special time-bound events with a fixed fee (e.g., "Picnic Fee"). These events automatically appear on the member's payment page.
-   **Data Management**:
    -   **Export Data**: Download a complete backup of all database tables into a single `.zip` file.
    -   **Import Data**: Restore the entire application state from a backup `.zip` file. This is a destructive action that wipes the current data.