"use strict";

const { google } = require('googleapis');
const { logger } = require('../src/lib/logger');
const fs = require('fs');
const path = require('path');

let sheetsClient = null;
let authClient = null;

/**
 * Initialize Google Sheets authentication
 * Uses service account credentials from environment
 */
async function initializeAuth() {
  if (authClient) {
    return authClient;
  }

  try {
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || '/app/google-service-account.json';

    // Check if credentials file exists
    if (!fs.existsSync(credentialsPath)) {
      throw new Error(`Google credentials file not found at ${credentialsPath}`);
    }

    // Load credentials from file
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));

    // Create JWT authentication
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    authClient = await auth.getClient();
    logger.info('Google Sheets authentication initialized successfully');
    return authClient;
  } catch (error) {
    logger.error('Failed to initialize Google Sheets authentication', { error: error.message });
    throw error;
  }
}

/**
 * Get or initialize Google Sheets API client
 */
async function getSheets() {
  if (sheetsClient) {
    return sheetsClient;
  }

  try {
    const auth = await initializeAuth();
    sheetsClient = google.sheets({ version: 'v4', auth });
    return sheetsClient;
  } catch (error) {
    logger.error('Failed to initialize Google Sheets client', { error: error.message });
    throw error;
  }
}

/**
 * Find a sheet by title
 * Returns the sheet title if found, otherwise null
 */
async function chooseTab(spreadsheetId, pinnedTitle) {
  try {
    const sheets = await getSheets();

    // Get spreadsheet metadata to see all sheets
    const response = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'sheets.properties.title',
    });

    const sheetTitles = response.data.sheets?.map(s => s.properties.title) || [];

    // First, try to find the pinned title
    if (pinnedTitle && sheetTitles.includes(pinnedTitle)) {
      logger.debug('Found pinned sheet tab', { title: pinnedTitle });
      return pinnedTitle;
    }

    // If no pinned title found, return the first sheet
    if (sheetTitles.length > 0) {
      logger.debug('Using first available sheet tab', { title: sheetTitles[0] });
      return sheetTitles[0];
    }

    logger.warn('No sheet tabs found in spreadsheet', { spreadsheetId });
    return null;
  } catch (error) {
    logger.error('Failed to choose sheet tab', {
      error: error.message,
      spreadsheetId,
      pinnedTitle
    });
    throw error;
  }
}

/**
 * Read stats data from a specific sheet
 * Expects first row to be headers, second row onwards to be data
 */
async function readStats(spreadsheetId, sheetTitle) {
  try {
    const sheets = await getSheets();

    // Read the sheet data with header row
    const range = `'${sheetTitle}'!A:Z`;
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const values = response.data.values || [];

    if (values.length === 0) {
      logger.warn('No data found in sheet', { spreadsheetId, sheetTitle });
      return {
        title: sheetTitle,
        count: 0,
        totalSim: 0,
        totalPower: 0,
        members: []
      };
    }

    // Parse headers and data
    const headers = values[0] || [];
    const headerMap = {};
    headers.forEach((h, i) => {
      headerMap[h.toLowerCase().trim()] = i;
    });

    // Parse data rows (skip header at index 0)
    const members = values.slice(1).map(row => ({
      name: row[headerMap['name']] || '',
      count: parseInt(row[headerMap['count']] || '0'),
      sim: parseFloat(row[headerMap['sim']] || '0'),
      power: parseFloat(row[headerMap['power']] || '0'),
    })).filter(m => m.name); // Filter out empty rows

    // Calculate totals
    const count = members.reduce((sum, m) => sum + (m.count || 0), 0);
    const totalSim = members.reduce((sum, m) => sum + (m.sim || 0), 0);
    const totalPower = members.reduce((sum, m) => sum + (m.power || 0), 0);

    logger.debug('Successfully read stats from Google Sheets', {
      spreadsheetId,
      sheetTitle,
      memberCount: members.length
    });

    return {
      title: sheetTitle,
      count,
      totalSim,
      totalPower,
      members
    };
  } catch (error) {
    logger.error('Failed to read stats from Google Sheets', {
      error: error.message,
      spreadsheetId,
      sheetTitle
    });
    throw error;
  }
}

module.exports = { chooseTab, readStats };
