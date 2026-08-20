import ticketConstants from "./ticket.constants.js";
import ticketRepository from "./ticket.repository.js";
import ticketService from "./ticket.service.js";
import ticketController from "./ticket.controller.js";
import ticketValidator from "./ticket.validator.js";

const ticketModule = Object.freeze({
    constants: ticketConstants,
    repository: ticketRepository,
    service: ticketService,
    controller: ticketController,
    validator: ticketValidator,
});

export default ticketModule;
