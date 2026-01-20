/*******************************************************
 * CTI Notification & Patient Dashboard System
 * Google Apps Script Backend
 *
 * Responsibilities:
 * - Send automated CTI notification emails
 * - Send weekly summary emails on Fridays
 * - Provide backend services for Patient Dashboard UI
 *******************************************************/


/**
 * Sends CTI notification emails and weekly summaries.
 * - Daily: Notifies staff when a patient is 15 days from certification end
 * - Fridays: Sends a weekly summary of upcoming certification dates
 */
function sendEmail() {

  /* ---------- Spreadsheet Data ---------- */
  const sheet = SpreadsheetApp.getActiveSheet();
  const lastRow = sheet.getLastRow();

  const notifyStaffFlags = sheet.getRange("J:J").getValues();
  const patientNames = sheet.getRange("A:A").getValues();
  const patientCtiDates = sheet.getRange("C:C").getValues();
  const patientNotifyDates = sheet.getRange("F:F").getValues();

  /* ---------- Email Configuration ---------- */
  const emailList = [
    "kobet@parrishhealthsystems.org",
    "reneesha@parrishhealthsystems.org",
    "Joyceboateng370@yahoo.com",
    "Kaylapudvan@gmail.com",
    "Ksmith9087@yahoo.com",
    "nassumpta@hotmail.com",
    "ksmith9087@yahoo.com",
    "olumideo@parrishhealthsystems.org",
    "miarac@parrishhealthsystems.org",
    "tajuanna@parrishhealthsystems.org",
    "kevo3415@yahoo.com"
  ];

  const weekdays = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const today = new Date();
  const currentDay = weekdays[today.getDay()];

  /* ---------- Helper Functions ---------- */

  /**
   * Checks if a date falls within a specific range
   */
  function isDateWithinRange(targetDate, startDate, endDate) {
    return targetDate >= startDate && targetDate <= endDate;
  }

  /* ---------- Weekly Summary (Fridays Only) ---------- */
  if (currentDay === "Friday") {

    const notifyDatesFlat = patientNotifyDates.flat();
    const currentWeek = parseInt(Utilities.formatDate(today, "GMT", "w"));
    const weeklySummary = [];

    notifyDatesFlat.forEach((date, index) => {
      if (!date) return;

      const rowWeek = parseInt(Utilities.formatDate(new Date(date), "GMT", "w"));

      // Include patients from this or last week
      if (rowWeek === currentWeek || rowWeek === currentWeek - 1) {
        weeklySummary.push(
          `${patientNames[index]} - Current Period [${patientCtiDates[index]}]\n`
        );
      }
    });

    emailList.forEach(email => {
      GmailApp.sendEmail(
        email,
        "[CTI Notification System] Weekly Summary",
        "Patients with upcoming dates this month.\n" + weeklySummary.join("")
      );
    });
  }

  /* ---------- Daily 15-Day Notifications ---------- */
  for (let i = 0; i < lastRow; i++) {
    if (notifyStaffFlags[i] === "true") {

      const message =
        `${patientNames[i]} is 15 days away from the end of their certification period.`;

      emailList.forEach(email => {
        Utilities.sleep(500); // Prevent rate limits
        GmailApp.sendEmail(
          email,
          "[CTI Notification System]",
          message
        );
      });
    }
  }
}


/* =====================================================
   Patient Dashboard Web App Backend
   ===================================================== */

const SHEET_NAME = "Sheet1";


/**
 * Serves the Patient Dashboard web interface
 */
function doGet() {
  return HtmlService.createHtmlOutputFromFile("Index")
    .setTitle("Patient Dashboard")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}


/**
 * Retrieves all patient records for the dashboard
 */
function getPatientData() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const patients = [];

  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) {
      patients.push({
        row: i + 1,
        name: data[i][0],
        admissionDate: data[i][1] ? formatDate(data[i][1]) : "",
        admissionDateRaw: data[i][1] ? new Date(data[i][1]).getTime() : null,
        currentPeriod: data[i][2] || "",
        recertPeriod: data[i][3] || "",
        recertStartDate: parseRecertDate(data[i][3])
      });
    }
  }

  return patients;
}


/**
 * Formats a Date object as M/D/YYYY
 */
function formatDate(date) {
  if (!date) return "";
  const d = new Date(date);
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}


/**
 * Extracts the start date from a recertification period string
 * Format: "M/D/YYYY > M/D/YYYY"
 */
function parseRecertDate(recertPeriod) {
  if (!recertPeriod) return null;
  const parts = recertPeriod.split(" > ");
  const parsed = new Date(parts[0].trim());
  return isNaN(parsed.getTime()) ? null : parsed.getTime();
}


/**
 * Adds a new patient row and copies formulas
 */
function addPatient(name, admissionDate) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const newRow = sheet.getLastRow() + 1;

  sheet.getRange(newRow, 1).setValue(name);
  sheet.getRange(newRow, 2).setValue(new Date(admissionDate));

  // Copy formulas from row 2
  if (newRow > 2) {
    ["C", "D"].forEach((col, index) => {
      const formula = sheet.getRange(2, index + 3).getFormula();
      if (formula) {
        sheet.getRange(newRow, index + 3)
          .setFormula(formula.replace(/2/g, newRow));
      }
    });
  }

  SpreadsheetApp.flush();
  return { success: true, message: "Patient added successfully" };
}


/**
 * Updates an existing patient record
 */
function updatePatient(row, name, admissionDate) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  sheet.getRange(row, 1).setValue(name);
  sheet.getRange(row, 2).setValue(new Date(admissionDate));
  SpreadsheetApp.flush();
  return { success: true, message: "Patient updated successfully" };
}


/**
 * Deletes a patient record
 */
function deletePatient(row) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  sheet.deleteRow(row);
  SpreadsheetApp.flush();
  return { success: true, message: "Patient deleted successfully" };
}


/**
 * Returns all unique admission years for filtering
 */
function getAvailableYears() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const dates = sheet.getRange(2, 2, sheet.getLastRow() - 1, 1).getValues();
  const years = new Set();

  dates.forEach(row => {
    if (row[0]) {
      const year = new Date(row[0]).getFullYear();
      if (!isNaN(year)) years.add(year);
    }
  });

  return Array.from(years).sort((a, b) => b - a);
}
