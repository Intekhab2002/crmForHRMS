export function setupSheet(workbook, name, columns) {
  const sheet = workbook.addWorksheet(name);
  sheet.columns = columns.map(([header, key, width = 18]) => ({
    header,
    key,
    width,
  }));

  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.autoFilter = {
    from: "A1",
    to: `${columnLetter(columns.length)}1`,
  };

  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).alignment = { vertical: "middle" };

  return sheet;
}

export function addRows(sheet, rows) {
  rows.forEach((row) => sheet.addRow(row));
}

export function formatDateColumns(sheet, keys) {
  for (const row of sheet.eachRow({ includeEmpty: false })) {
    for (const key of keys) {
      const column = sheet.getColumn(key);
      const cell = row.getCell(column.number);
      if (cell.value) cell.numFmt = "yyyy-mm-dd hh:mm:ss";
    }
  }
}

function columnLetter(number) {
  let value = "";
  let n = number;
  while (n > 0) {
    const remainder = (n - 1) % 26;
    value = String.fromCharCode(65 + remainder) + value;
    n = Math.floor((n - 1) / 26);
  }
  return value;
}
