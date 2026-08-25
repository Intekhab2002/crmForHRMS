import ticketNumberRepository from "./ticketNumber.repository.js";
import ticketNumberConfig from "./ticketNumber.config.js";

function getCurrentYear() {
    return new Date().getFullYear();
}

function padNumber(number, padding) {
    return String(number).padStart(padding, "0");
}

function buildTicketNumber(year, number) {
    const paddedNumber = padNumber(
        number,
        ticketNumberConfig.padding,
    );

    const parts = [ticketNumberConfig.prefix];

    if (ticketNumberConfig.includeYear) {
        parts.push(String(year));
    }

    parts.push(paddedNumber);

    return parts.join(ticketNumberConfig.separator);
}

async function generateTicketNumber(tx = null) {
    const year = getCurrentYear();

    const number =
        await ticketNumberRepository.reserveNextNumber(
            year,
            ticketNumberConfig.startingNumber,
            tx,
        );

    return buildTicketNumber(year, number);
}

export default Object.freeze({
    generateTicketNumber,
});