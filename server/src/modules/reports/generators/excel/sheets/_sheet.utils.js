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
  if (!sheet || !Array.isArray(keys) || keys.length === 0) {
    return;
  }

  const columns = keys.map((key) => sheet.getColumn(key));

  sheet.eachRow(
    { includeEmpty: false },
    (row) => {
      for (const column of columns) {
        const cell = row.getCell(column.number);

        if (cell.value instanceof Date) {
          cell.numFmt = "yyyy-mm-dd hh:mm:ss";
        }
      }
    },
  );
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
