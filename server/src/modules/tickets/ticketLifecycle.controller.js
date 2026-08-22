import ticketService from "./ticket.service.js";
import ticketLifecycleService from "./ticketLifecycle.service.js";

async function getLifecycle(req, res) {
    const { ticketId } = req.params;

    await ticketService.getTicket(ticketId);

    const lifecycle =
        await ticketLifecycleService.getTicketLifecycle(
            ticketId,
        );

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: "Ticket lifecycle retrieved successfully.",
        data: lifecycle,
    });
}

export default Object.freeze({
    getLifecycle,
});