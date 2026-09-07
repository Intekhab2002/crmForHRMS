import ticketExportService from "./ticketExport.service.js";

async function exportTickets(req, res, next) {
  try {
    await ticketExportService.exportTickets({
      ...req.validatedBody,
      response: res,
    });
  } catch (error) {
    if (res.headersSent || res.destroyed) {
      res.destroy(error);
      return;
    }

    return next(error);
  }
}

export default Object.freeze({
  exportTickets,
});
