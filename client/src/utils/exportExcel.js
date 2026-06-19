import * as XLSX from "xlsx";

export const exportToExcel = (data, filename, sheetName = "Sheet1") => {
  if (!data || data.length === 0) {
    return false;
  }

  const worksheet = XLSX.utils.json_to_sheet(data);

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  XLSX.writeFile(workbook, `${filename}.xlsx`);

  return true;
};
