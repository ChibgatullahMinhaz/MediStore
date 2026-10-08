import { z } from "zod";

export const numericString = z.coerce.number();

export const booleanString = z.preprocess((val) => {
  if (typeof val === "string") {
    if (val.toLowerCase() === "true") return true;
    if (val.toLowerCase() === "false") return false;
  }
  return val;
}, z.boolean());
