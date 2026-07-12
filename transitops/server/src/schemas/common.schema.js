import { z } from "zod";

const isoDateInput = z.union([
  z.iso.date(),
  z.iso.datetime({
    local: true,
    offset: true,
  }),
]);

function normalizeNumber(value) {
  if (typeof value === "number") {
    return value;
  }

  if (
    typeof value === "string" &&
    value.trim() !== ""
  ) {
    return Number(value);
  }

  return Number.NaN;
}

function normalizeDate(value) {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value !== "string") {
    return new Date(Number.NaN);
  }

  const input = value.trim();

  if (!isoDateInput.safeParse(input).success) {
    return new Date(Number.NaN);
  }

  return new Date(input);
}

/*
 * JavaScript coercion turns booleans, null, blank strings and arrays
 * into valid numbers/dates. HTTP payload validation must reject them.
 */
export function numberInput(numberSchema = z.number()) {
  return z.preprocess(
    normalizeNumber,
    numberSchema
  );
}

export function dateInput(message = "Enter a valid date") {
  return z.preprocess(
    normalizeDate,
    z.date({
      error: message,
    })
  );
}

export const decimalLimits = Object.freeze({
  decimal10Scale2: 99_999_999.99,
  decimal12Scale2: 9_999_999_999.99,
  decimal14Scale2: 999_999_999_999.99,
});
