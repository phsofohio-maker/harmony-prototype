# harmony-prototype
**Harmony Health Care Assistant** project.

The system architecture, the three main modules (CTI, HUV, Dashboard), and the setup instructions.

# Harmony Health Care Assistant

**Harmony** is an automated compliance and patient management system developed for **Parrish Health Systems**. It integrates Google Sheets, Google Docs, and a web-based Dashboard to automate patient certification tracking (CTI) and HOPE Update Visit (HUV) protocols.

## 📋 Project Overview

This system is designed to reduce administrative overhead by:

1. **Automating Document Creation:** Automatically generating and emailing required patient certification PDF packets.
2. **Tracking Deadlines:** Monitoring admission dates to calculate critical compliance windows.
3. **Visualizing Data:** Providing a secure, PIN-protected web dashboard for nursing staff and administrators.

## ⚙️ Modules

### 1. CTI Automation (Certification Tracking)

*File:* `CTI Document Generation.gs`

This script runs daily to monitor patient admission dates and determine certification requirements.

* **Logic:** Calculates "Days Since Admission" to determine the certification period:
* **Initial (0-90 days):** Generates `90DAY1`, `ATTEND_CERT`, `PATIENT_HISTORY`.
* **Second Period (91-180 days):** Generates `90DAY2`, `PROGRESS_NOTE`.
* **Subsequent (180+ days):** Generates `60DAY`, `PROGRESS_NOTE`.


* **Document Generation:** Pulls templates from Google Drive, fills placeholders (e.g., `{{Patient_Name}}`, `{{MR_Number}}`), converts them to PDF, and emails them to the staff list.
* **Triggers:**
* **Daily (9 AM):** Checks for certifications due *today*.
* **Weekly (Monday 8 AM):** Sends a summary of all certifications upcoming in the current month.



### 2. HOPE / HUV Tracking

*File:* `HUV Notifications.gs`

Manages the **HOPE Update Visit** protocol windows based on the Start of Care (SOC) date.

* **Window Calculation:**
* **HUV1:** Days 6 - 15
* **HUV2:** Days 16 - 30


* **Reporting:** Sends a daily HTML email report highlighting patients with "Action Needed" (window active) or "Overdue" status.

### 3. Care Dashboard

*Files:* `index.html`, `CTI Email Notifications.gs` (Backend)

A responsive web application accessible via browser.

* **Security:** Protected by a PIN entry overlay.
* **Features:**
* **Overview:** High-level stats on total patients and upcoming recertifications.
* **CTI View:** Filterable list of patients showing current certification periods.
* **HUV View:** Interactive table allowing staff to check off HUV1/HUV2 completion status directly.
* **Patient Management:** Tools to add new patients to the system.



## 🛠️ Configuration

The system relies on a central configuration object in `CTI Document Generation.gs`:

```javascript
const CONFIG = {
  SHEET_ID: 'YOUR_SPREADSHEET_ID',
  EMAIL_LIST: ['staff@parrishhealthsystems.org', ...],
  DOCTOR_NAME: 'Dr. Thomas Smallwood',
  DOC_TEMPLATES: {
    '60DAY': 'GOOGLE_DOC_ID',
    '90DAY1': 'GOOGLE_DOC_ID',
    // ... other template IDs
  }
};

```

### Template Placeholders

Ensure Google Doc templates contain the following keys for auto-replacement:

* `{{Patient_Name}}`
* `{{MR_Number}}`
* `{{Admission_Date}}`
* `{{Notify_Date}}`
* `{{Cert_Period}}`
* `{{Doctor_Name}}`

## 🚀 Installation & Setup

1. **Google Sheets:** Ensure the source sheet matches the column structure defined in `CONFIG.COLUMNS` (Admission Date, Notify Date, MR Number, etc.).
2. **Google Drive:** Store all document templates in a dedicated folder.
3. **Triggers:**
* Run `createDailyTrigger()` once to initialize the daily 9 AM check.
* Run `createWeeklyTrigger()` once to initialize the Monday summary.


4. **Dashboard Deployment:**
* Deploy the script as a Web App (Execute as: *Me*, Who has access: *Anyone within [Organization]*).



## 🧪 Testing

The system includes built-in testing functions:

* `testAllDocuments()`: Generates dummy PDFs for all 6 template types and emails them to verify formatting.
* `findMissedCertifications()`: Manually triggers a check for a specific date range (useful for retroactive checks).

## 📄 License

Internal use for **Parrish Health Systems of Ohio**.
