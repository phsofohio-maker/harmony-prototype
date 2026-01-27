function sendEmail() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var lastRow = sheet.getLastRow();
  var notify_staff = sheet.getRange("J:J").getValues();
  var patient_name = sheet.getRange("A:A").getValues();
  var patient_cti_date = sheet.getRange("C:C").getValues();
  var patient_notify_date = sheet.getRange("F:F").getValues();
  const email_list = ["kobet@parrishhealthsystems.org","reneesha@parrishhealthsystems.org","Joyceboateng370@yahoo.com","Kaylapudvan@gmail.com","Ksmith9087@yahoo.com","nassumpta@hotmail.com","olumideo@parrishhealthsystems.org","miarac@parrishhealthsystems.org","tajuanna@parrishhealthsystems.org","kevo3415@yahoo.com","lewisgena291@gmail.com"];
  const weekday = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const d = new Date();

  function isDateWithinRange(targetDate, startDate, endDate) {
  return targetDate >= startDate && targetDate <= endDate;
  }
  
  //notify_staff.forEach(function(){
   // Logger.log(notify_staff)
 // })
  
  let day = weekday[d.getDay()];
  let weekly_summary_email = [];
  if (day == "Friday") {
  const vs = patient_notify_date.flat();
  const wk = parseInt(Utilities.formatDate(new Date(), "GMT", "w"));
  vs.forEach((d,i) => {
    let w =parseInt(Utilities.formatDate(new Date(d), "GMT", "w"));
    if(w == wk || w == wk - 1) {//try this for last two weeks. This may not work at beginning of year...I don't know for sure.
      Logger.log(patient_name[i])
      weekly_summary_email.push(patient_name[i] + " - Current Period [" + patient_cti_date[i] + "]\n")
    } else (
      Logger.log("")
    )
  });

  email_list.forEach((email,v) => {
      if (day == "Friday") {
      GmailApp.sendEmail(
        email,
        '[CTI Notification System] Weekly Summary',
        "Patients with upcoming dates this month.\n" + weekly_summary_email,
      )
    }
  })
  }

  let w = Utilities.formatDate(new Date(), "GMT", "w");
  for (var i = 0; i < lastRow ; i++) {
    if (notify_staff[i] == "true") {
      Logger.log(notify_staff[i])
      Logger.log(patient_name[i])

      let message = patient_name[i] + " is 15 days away from the end of their certification period."
      for (var o = 0; o < email_list.length ; o++) {
        Logger.log(email_list[o])
        Utilities.sleep(500)
         GmailApp.sendEmail(
        email_list[o],
        '[CTI Notification System]',
         message,
        )
      }
    }
  }
}

// Code.gs - Google Apps Script Backend

const SHEET_NAME2 = 'Sheet1'; // Change to your sheet name

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Patient Dashboard')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getPatientData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME2);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const patients = [];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) { // Only include rows with patient names
      patients.push({
        row: i + 1,
        name: data[i][0],
        admissionDate: data[i][1] ? formatDate(data[i][1]) : '',
        admissionDateRaw: data[i][1] ? new Date(data[i][1]).getTime() : null,
        currentPeriod: data[i][2] || '',
        recertPeriod: data[i][3] || '',
        recertStartDate: parseRecertDate(data[i][3])
      });
    }
  }
  
  return patients;
}

function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return (d.getMonth() + 1) + '/' + d.getDate() + '/' + d.getFullYear();
}

function parseRecertDate(recertPeriod) {
  if (!recertPeriod) return null;
  // Parse the start date from "M/D/YYYY > M/D/YYYY" format
  const parts = recertPeriod.split(' > ');
  if (parts.length > 0) {
    const dateStr = parts[0].trim();
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? null : parsed.getTime();
  }
  return null;
}

function addPatient(name, admissionDate) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME2);
  const lastRow = sheet.getLastRow() + 1;
  
  sheet.getRange(lastRow, 1).setValue(name);
  sheet.getRange(lastRow, 2).setValue(new Date(admissionDate));
  
  // Copy formulas from row 2 if they exist
  if (lastRow > 2) {
    const formulaRangeC = sheet.getRange(2, 3);
    const formulaRangeD = sheet.getRange(2, 4);
    
    if (formulaRangeC.getFormula()) {
      const formulaC = formulaRangeC.getFormula().replace(/2/g, lastRow);
      sheet.getRange(lastRow, 3).setFormula(formulaC);
    }
    if (formulaRangeD.getFormula()) {
      const formulaD = formulaRangeD.getFormula().replace(/2/g, lastRow);
      sheet.getRange(lastRow, 4).setFormula(formulaD);
    }
  }
  
  SpreadsheetApp.flush();
  return { success: true, message: 'Patient added successfully' };
}

function updatePatient(row, name, admissionDate) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME2);
  
  sheet.getRange(row, 1).setValue(name);
  sheet.getRange(row, 2).setValue(new Date(admissionDate));
  
  SpreadsheetApp.flush();
  return { success: true, message: 'Patient updated successfully' };
}

function deletePatient(row) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME2);
  
  sheet.deleteRow(row);
  
  SpreadsheetApp.flush();
  return { success: true, message: 'Patient deleted successfully' };
}

function getAvailableYears() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME2);
  const data = sheet.getRange(2, 2, sheet.getLastRow() - 1, 1).getValues();
  const years = new Set();
  
  data.forEach(row => {
    if (row[0]) {
      const year = new Date(row[0]).getFullYear();
      if (!isNaN(year)) years.add(year);
    }
  });
  
  return Array.from(years).sort((a, b) => b - a);
}

/* =====================================================
   DASHBOARD INTEGRATION: HUV DATA
   ===================================================== */

/**
 * Retrieves HUV specific data from the HOPE/HUV sheet.
 * Maps columns: A=Name, B=SOC Date, C=HUV1 Status, D=HUV2 Status
 */
function getHUVData() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("HOPE/HUV");
  if (!sheet) return []; // Return empty if sheet doesn't exist

  const data = sheet.getDataRange().getValues();
  const huvPatients = [];

  // Assuming Row 1 is headers, start at i=1
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0]) { // If name exists
      huvPatients.push({
        row: i + 1,            // 1-based row index for updates
        name: row[0],          // Col A: Patient Name
        socDate: row[1] ? new Date(row[1]).getTime() : null, // Col B: SOC Date
        huv1Done: row[2] === true, // Col C: Checkbox/Boolean
        huv2Done: row[3] === true  // Col D: Checkbox/Boolean
      });
    }
  }
  return huvPatients;
}

/**
 * Updates the HUV checkbox status in the spreadsheet
 * @param {number} row - The spreadsheet row number
 * @param {number} huvNum - 1 for HUV1, 2 for HUV2
 * @param {boolean} status - True/False
 */
function updateHUVStatus(row, huvNum, status) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("HOPE/HUV");
  const colIndex = (huvNum === 1) ? 3 : 4; // Col C (3) or Col D (4)
  sheet.getRange(row, colIndex).setValue(status);
}
