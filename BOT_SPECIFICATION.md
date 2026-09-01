# Application Bot Specification
## Automated Response System for Student & Job Applications

---

## 1. BOT OVERVIEW
A real-time bot that listens to new applications (both student admissions and job applications) and sends automated acknowledgment messages to applicants.

---

## 2. DATABASE STRUCTURE & DATA FLOW

### 2.1 Collections to Monitor

#### **Collection 1: `student_applications`**
```
Document Structure:
{
  id: string (auto-generated)
  firstName: string
  lastName: string
  dob: string
  gender: 'Male' | 'Female'
  address: string
  guardianPhone: string
  guardianEmail: string  ← MESSAGE RECIPIENT
  status: 'Pending' | 'Approved' | 'Rejected'
  adminReply?: string (filled later by admin)
  timestamp: string (ISO format)
}
```
**Collection Path:** `db.collection('student_applications')`

---

#### **Collection 2: `applications`** (Job Applications)
```
Document Structure:
{
  id: string (auto-generated)
  fullName: string
  email: string  ← MESSAGE RECIPIENT
  phone: string
  position: string
  coverLetter: string
  cvBase64?: string
  cvName?: string
  status: 'Pending' | 'Reviewed' | 'Shortlisted' | 'Rejected'
  timestamp: string (ISO format)
}
```
**Collection Path:** `db.collection('applications')`

---

### 2.2 New Collection: `application_messages`
Create this collection to track bot-sent messages:
```
Document Structure:
{
  id: string (auto-generated)
  applicationId: string (links to source application)
  applicationType: 'student' | 'job'
  recipientEmail: string
  recipientPhone?: string
  recipientName: string
  messageType: 'auto_acknowledgment' | 'status_update'
  messageContent: string
  messageTemplate: 'acknowledgment' | 'approval' | 'rejection'
  status: 'sent' | 'failed' | 'queued'
  sentAt: string (timestamp)
  readAt?: string (if read receipt needed)
  errorLog?: string (if failed)
}
```
**Collection Path:** `db.collection('application_messages')`

---

### 2.3 New Collection: `bot_messages`** (Message Templates)
```
Document Structure:
{
  id: string
  type: 'student_acknowledgment' | 'job_acknowledgment' | 'status_update'
  subject: string
  body: string
  templateVariables: string[] (e.g., ["{firstName}", "{applicationId}", "{status}"])
}
```
**Collection Path:** `db.collection('bot_messages')`

---

## 3. BOT WORKFLOW

### 3.1 Real-Time Listener Setup
```
Listen to: 'student_applications' collection
Trigger: New document created with status = 'Pending'
Action: Send acknowledgment message

Listen to: 'applications' collection
Trigger: New document created with status = 'Pending'
Action: Send acknowledgment message

Listen to: Any application status update
Trigger: status changes from 'Pending' → 'Approved'/'Rejected'
Action: Send status update message with admin reply
```

---

## 4. MESSAGE RETRIEVAL & CUSTOMIZATION

### 4.1 Get Message Template
**Location to fetch from:** `bot_messages` collection

**Query:**
```typescript
// For Student Applications
const template = db.collection('bot_messages')
  .where('type', '==', 'student_acknowledgment')
  .get()

// For Job Applications
const template = db.collection('bot_messages')
  .where('type', '==', 'job_acknowledgment')
  .get()
```

**Template Example:**
```
Subject: "Thank you for your Application"
Body: 
  "Dear {firstName},
   
   Thank you for submitting your application for admission.
   
   Application ID: {applicationId}
   Status: {status}
   
   We will review your application and respond within 5-7 business days.
   
   Best regards,
   Defined Domains Team"
```

---

## 5. MESSAGE DELIVERY CHANNELS

### 5.1 Email Delivery
**Recipient Email From:**
- **Student Apps:** `studentApplication.guardianEmail`
- **Job Apps:** `application.email`

**Service:** Firebase Cloud Functions + SendGrid / Gmail API / Firebase Messaging

---

### 5.2 SMS Delivery (Optional)
**Recipient Phone From:**
- **Student Apps:** `studentApplication.guardianPhone`
- **Job Apps:** `application.phone`

**Service:** Firebase Cloud Functions + Twilio / Firebase Cloud Messaging

---

## 6. BOT FUNCTIONS BREAKDOWN

### 6.1 **Function: `listenToNewApplications()`**
```typescript
Listens to: collection('student_applications')
Triggers on: New document with status = 'Pending'
Gets: applicantName, guardianEmail, guardianPhone, applicationId
Calls: sendStudentAcknowledgmentMessage()
```

### 6.2 **Function: `listenToNewJobApplications()`**
```typescript
Listens to: collection('applications')
Triggers on: New document with status = 'Pending'
Gets: fullName, email, phone, position, applicationId
Calls: sendJobAcknowledgmentMessage()
```

### 6.3 **Function: `sendStudentAcknowledgmentMessage(applicationData)`**
```typescript
1. Get template from bot_messages (type: 'student_acknowledgment')
2. Replace variables: {firstName}, {applicationId}, {status}
3. Prepare email payload
4. Send via email service
5. Log message in application_messages collection
6. Update application_messages status to 'sent'
```

### 6.4 **Function: `sendJobAcknowledgmentMessage(applicationData)`**
```typescript
1. Get template from bot_messages (type: 'job_acknowledgment')
2. Replace variables: {fullName}, {position}, {applicationId}, {status}
3. Prepare email payload
4. Send via email service
5. Log message in application_messages collection
6. Update application_messages status to 'sent'
```

### 6.5 **Function: `listenToStatusUpdates()`**
```typescript
Listens to: collection('applications') and collection('student_applications')
Triggers on: status field changes
If status = 'Approved':
  - Get admin reply from adminReply field
  - Get template (type: 'approval')
  - Replace variables + include admin message
  - Send notification

If status = 'Rejected':
  - Get admin reply from adminReply field
  - Get template (type: 'rejection')
  - Replace variables + include rejection reason
  - Send notification
```

### 6.6 **Function: `logMessage(messageData)`**
```typescript
Store in: collection('application_messages')
Fields:
  - applicationId (reference)
  - applicationType ('student' | 'job')
  - recipientEmail
  - recipientPhone
  - messageContent
  - sentAt (timestamp)
  - status ('sent' | 'failed')
  - errorLog (if failed)
```

---

## 7. QUERY DIAGRAM

```
┌─────────────────────────────────────────────────────────┐
│            New Application Submitted                     │
│  (student_applications or applications collection)      │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
            ┌──────────────────────┐
            │   Check status field │
            │  Is status='Pending'?│
            └──────────┬───────────┘
                       │ YES
                       ▼
        ┌──────────────────────────────┐
        │  Fetch Message Template      │
        │ from bot_messages collection │
        └──────────────┬───────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │   Replace Template Variables │
        │ {firstName}, {applicationId} │
        │ {email}, {status}, etc.      │
        └──────────────┬───────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │  Send Email/SMS Message      │
        │  To: recipient email/phone   │
        └──────────────┬───────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │  Log Message Delivery        │
        │ In: application_messages col │
        │ status: 'sent' or 'failed'   │
        └──────────────────────────────┘
```

---

## 8. DATABASE COLLECTIONS SUMMARY

| Collection | Purpose | Key Fields |
|-----------|---------|-----------|
| `student_applications` | Stores student admission applications | guardianEmail, status, timestamp |
| `applications` | Stores job applications | email, status, timestamp |
| `application_messages` | Logs all bot-sent messages | applicationId, recipientEmail, status |
| `bot_messages` | Stores message templates | type, subject, body, templateVariables |

---

## 9. BOT IMPLEMENTATION LOCATION

**Recommended Architecture:**
- **Option A:** Cloud Functions (Firebase) - runs server-side, scales automatically
- **Option B:** Backend service (Node.js/Express) - deployed separately
- **Option C:** useStore.ts hooks - client-side listeners (not recommended for production)

**Recommended:** **Option A - Firebase Cloud Functions** (most cost-effective for this use case)

---

## 10. ERROR HANDLING & RETRY LOGIC

```
If message fails to send:
  1. Log error in application_messages.errorLog
  2. Set status to 'failed'
  3. Implement retry queue (max 3 retries)
  4. Alert admin if delivery fails after retries
```

---

## 11. ADMIN CONTROLS IN UI

**Where to add in Admin Portal:**

```
Components to create:
1. BotSettings.tsx
   - Configure message templates
   - Toggle bot on/off
   - View message delivery logs
   
2. MessageTemplateEditor.tsx
   - Edit acknowledgment messages
   - Edit approval/rejection templates
   - Preview with sample data
   
3. MessageDeliveryLog.tsx
   - List all sent messages
   - Filter by status (sent, failed)
   - Retry failed messages
   - View delivery timestamp
```

---

## 12. SECURITY & PERMISSIONS

- Bot should run with service account (not user credentials)
- Message templates should be editable only by SUPER_ADMIN
- Delivery logs visible to ADMIN_SUPPORT and SUPER_ADMIN
- Email/phone should be masked in delivery logs (privacy)

---

## 13. TESTING CHECKLIST

- [ ] Listener triggers on new application
- [ ] Correct email recipient is identified
- [ ] Template variables are replaced correctly
- [ ] Message sends successfully
- [ ] Delivery logged in application_messages
- [ ] Status changes trigger update notifications
- [ ] Retry logic works on failed sends
- [ ] Admin can view delivery logs
- [ ] Admin can edit message templates

