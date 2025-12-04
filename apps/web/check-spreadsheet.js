const Spreadsheet = require('x-data-spreadsheet/dist/xspreadsheet.js');
console.log('Type of Spreadsheet:', typeof Spreadsheet);
console.log('Is Spreadsheet a constructor?', typeof Spreadsheet === 'function' && /^\s*class\s+/.test(Spreadsheet.toString()));
console.log('Spreadsheet keys:', Object.keys(Spreadsheet));
if (Spreadsheet.default) {
    console.log('Type of Spreadsheet.default:', typeof Spreadsheet.default);
}
