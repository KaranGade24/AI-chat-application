/**
 * Safe math calculator tool
 * Evaluates math expressions without exposing arbitrary code execution
 * @param {string} expression - Mathematical formula, e.g. "25 * 40 + 120"
 */
export const calculate = (expression) => {
  try {
    if (!expression || typeof expression !== "string") {
      return "Error: No mathematical expression provided.";
    }

    // Clean up input
    let sanitized = expression
      .trim()
      .replace(/×/g, "*")
      .replace(/÷/g, "/")
      .replace(/\^/g, "**")
      .replace(/percentage of/gi, "* 0.01 *")
      .replace(/% of/gi, "* 0.01 *")
      .replace(/%/g, "* 0.01");

    // Whitelist only safe mathematical characters and Math.* functions
    const allowedPattern = /^[0-9+\-*/(). ,eEMath.PIEsqrtcointalgb]+$/;
    
    // Replace standard math functions with JavaScript Math calls
    sanitized = sanitized
      .replace(/\bsqrt\b/g, "Math.sqrt")
      .replace(/\bsin\b/g, "Math.sin")
      .replace(/\bcos\b/g, "Math.cos")
      .replace(/\btan\b/g, "Math.tan")
      .replace(/\blog\b/g, "Math.log10")
      .replace(/\bln\b/g, "Math.log")
      .replace(/\babs\b/g, "Math.abs")
      .replace(/\bpi\b/gi, "Math.PI");

    // Validate that only safe math tokens exist
    const isValid = /^[\d\s+\-*/().,MathPIEsqrtcointalgb]+$/.test(sanitized);
    if (!isValid) {
      return `Error: Invalid mathematical expression '${expression}'. Contains unsupported characters.`;
    }

    // Evaluate in restricted scope
    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${sanitized});`)();

    if (typeof result !== "number" || Number.isNaN(result)) {
      return `Error: Could not calculate a valid numeric result for '${expression}'.`;
    }

    return `Calculation result: ${expression} = ${result}`;
  } catch (err) {
    return `Error calculating '${expression}': ${err.message}`;
  }
};
