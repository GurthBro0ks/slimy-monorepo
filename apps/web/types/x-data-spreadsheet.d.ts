declare module 'x-data-spreadsheet/dist/xspreadsheet.js' {
    export default class Spreadsheet {
        constructor(element: HTMLElement | null, options?: any);
        loadData(data: any): void;
    }
}
