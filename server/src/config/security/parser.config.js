/**
 * -----------------------------------------------------------------------------
 * File: parser.config.js
 * Path: src/config/security/parser.config.js
 * -----------------------------------------------------------------------------
 * Description:
 * Centralized request body parser configuration.
 *
 * Responsibilities:
 * - Configure JSON request parser
 * - Configure URL-encoded request parser
 * - Export parser factories
 * - Centralize payload limits
 *
 * -----------------------------------------------------------------------------
 */

import express from "express";

import appConfig from "../app.config.js";
import logger from "../logger.js";

/**
 * JSON parser configuration.
 *
 * @type {import("express").OptionsJson}
 */
const jsonParserOptions = {
  limit: appConfig.http.requestBodySize,
  strict: true,
  type: "application/json",
};

/**
 * URL-encoded parser configuration.
 *
 * @type {import("express").OptionsUrlencoded}
 */
const urlEncodedParserOptions = {
  extended: true,
  limit: appConfig.http.requestBodySize,
  parameterLimit: appConfig.http.parameterLimit,
};

/**
 * Creates the JSON request body parser middleware.
 *
 * @returns {import("express").RequestHandler}
 */
function createJsonParser() {
  logger.info("JSON body parser initialized.", {
    limit: jsonParserOptions.limit,
    strict: jsonParserOptions.strict,
  });

  return express.json(jsonParserOptions);
}

/**
 * Creates the URL-encoded body parser middleware.
 *
 * @returns {import("express").RequestHandler}
 */
function createUrlEncodedParser() {
  logger.info("URL-encoded body parser initialized.", {
    limit: urlEncodedParserOptions.limit,
    parameterLimit: urlEncodedParserOptions.parameterLimit,
  });

  return express.urlencoded(urlEncodedParserOptions);
}

export {
  jsonParserOptions,
  urlEncodedParserOptions,
  createJsonParser,
  createUrlEncodedParser,
};
