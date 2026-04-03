/**
 * Club snapshot Excel export utility.
 * Ported from /opt/slimy/app/utils/xlsx-export.js
 *
 * Generates .xlsx files with member power data, matching the Google Sheet format.
 */

import * as fs from "fs";
import * as path from "path";
import XLSX from "xlsx";
import { database } from "./database.js";
import { getLatestForGuild } from "./club-store.js";

const EXPORT_DIR = path.join(process.cwd(), "data", "club-exports");

// Column definitions: Name | SIM Power | Total Power | Change % from last week
const COLUMNS = [
  { header: "Name", key: "name", width: 22 },
  { header: "SIM Power", key: "sim_power", width: 15 },
  { header: "Total Power", key: "total_power", width: 15 },
  { header: "Change % from last week", key: "change_pct", width: 25 },
];

// Header style: cyan/aqua background, bold white text
const HEADER_BG = "00FFFF";
const HEADER_FONT = { bold: true, color: "FFFFFF" };

function sheetDate(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export interface ClubExportResult {
  filePath: string;
  fileName: string;
}

/**
 * Generate a club snapshot .xlsx file.
 *
 * @param guildId - The guild ID
 * @param snapshotAt - The snapshot timestamp
 * @returns {{ filePath: string, fileName: string }}
 */
export async function generateClubExport(
  guildId: string,
  snapshotAt: Date | string,
): Promise<ClubExportResult> {
  // Fetch current members from club_latest
  const members = await getLatestForGuild(guildId);

  // Sort by total_power descending (nulls last)
  const sorted = [...members].sort((a, b) => {
    const aVal = a.total_power ?? -Infinity;
    const bVal = b.total_power ?? -Infinity;
    return bVal - aVal;
  });

  // Build data rows
  const rows = sorted.map((m) => {
    const name = (m.name_display || m.name_canonical || "").toString();
    const simPower = m.sim_power != null ? Number(m.sim_power) : null;
    const totalPower = m.total_power != null ? Number(m.total_power) : null;
    const changePct = m.total_pct_change != null ? Number(m.total_pct_change) : null;

    return { name, sim_power: simPower, total_power: totalPower, change_pct: changePct };
  });

  // Create workbook
  const wb = XLSX.utils.book_new();

  const dateStr = sheetDate(snapshotAt);
  const wsName = dateStr; // tab name = "2026-03-24"

  // Build worksheet data: row 1 = headers, rest = data
  const headerRow = COLUMNS.map((c) => c.header);
  const dataRows = rows.map((r) => [r.name, r.sim_power, r.total_power, r.change_pct]);
  const allRows: (string | number | null)[][] = [headerRow, ...dataRows];

  const ws = XLSX.utils.aoa_to_sheet(allRows);

  // Apply column widths
  ws["!cols"] = COLUMNS.map((c) => ({ wch: c.width }));

  // Style header row (row index 0)
  const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddr = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!ws[cellAddr]) continue;
    ws[cellAddr].s = {
      fill: { fgColor: { rgb: HEADER_BG } },
      font: HEADER_FONT,
      alignment: { horizontal: "center" },
    };
  }

  // Format data cells
  // B column (col 1): SIM Power — comma-separated integers
  // C column (col 2): Total Power — comma-separated integers
  // D column (col 3): Change % — percentage format +0.0%;-0.0%
  for (let rowIdx = 1; rowIdx <= range.e.r; rowIdx++) {
    const bCell = XLSX.utils.encode_cell({ r: rowIdx, c: 1 });
    if (ws[bCell] && (ws[bCell] as XLSX.CellObject).t === "n") {
      (ws[bCell] as XLSX.CellObject).z = "#,##0";
    }

    const cCell = XLSX.utils.encode_cell({ r: rowIdx, c: 2 });
    if (ws[cCell] && (ws[cCell] as XLSX.CellObject).t === "n") {
      (ws[cCell] as XLSX.CellObject).z = "#,##0";
    }

    const dCell = XLSX.utils.encode_cell({ r: rowIdx, c: 3 });
    if (ws[dCell] && (ws[dCell] as XLSX.CellObject).t === "n") {
      (ws[dCell] as XLSX.CellObject).z = "+0.0%;-0.0%";
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, wsName);

  // Ensure export dir exists
  fs.mkdirSync(EXPORT_DIR, { recursive: true });

  const fileName = `club-snapshot-${dateStr}.xlsx`;
  const filePath = path.join(EXPORT_DIR, fileName);

  XLSX.writeFile(wb, filePath);

  return { filePath, fileName };
}
