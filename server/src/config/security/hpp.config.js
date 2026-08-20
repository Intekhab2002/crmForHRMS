import hpp from "hpp";
import logger from "../logger.js";

function createHppMiddleware() {
  logger.info("HPP protection initialized.");

  return hpp();
}

export { createHppMiddleware };

export default createHppMiddleware;