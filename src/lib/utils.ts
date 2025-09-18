import { promises as fs } from "fs";
import path from "path";
/**
 * ### Environmental Variables Helpers
 *
 * @description Utilities to fetch environment variables with type handling.
 *
 */
export namespace Env {
  /**
   * Get environment variable as a string.
   * @param {string} key - Environment variable key
   * @param {string} defaultValue - Default fallback value
   * @returns {string}
   */
  export function getString(key: string, defaultValue: string = ""): string {
    const value = process.env[key] ?? "";
    return value === "" ? defaultValue : value;
  }

  /**
   * Get environment variable as a number.
   * @param {string} key - Environment variable key
   * @param {number} defaultValue - Default fallback value
   * @returns {number}
   */
  export function getNumber(key: string, defaultValue: number = 0): number {
    const value = process.env[key];
    if (value === undefined || value.trim() === "") {
      return defaultValue;
    }
    // Convert to a number and return if valid
    const parsed = Number(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  /**
   * Get environment variable as a boolean.
   * @param {string} key - Environment variable key
   * @param {boolean} defaultValue - Default fallback value
   * @returns {boolean}
   */
  export function getBoolean(
    key: string,
    defaultValue: boolean = false
  ): boolean {
    const value = process.env[key]?.toLowerCase() ?? "";
    return ["true", "1", "yes", "y", "t"].includes(value) ? true : defaultValue;
  }

  /**
   * Get environment variable as a time period *in seconds*.
   * @param {string} key - Environment variable key
   * @param {string | number} defaultValue - Default fallback value
   * @returns {number} Period in seconds
   */
  export function getPeriod(
    key: string,
    defaultValue: string = "30 min"
  ): number {
    const value = process.env[key];
    let period = defaultValue;
    if (value && value.trim() !== "") {
      period = value;
    }
    const [amount, type] = period.split(" ");
    switch (type) {
      case "d":
      case "day":
      case "days":
        return parseInt(amount) * 86400;
      case "h":
      case "hr":
      case "hour":
      case "hours":
        return parseInt(amount) * 3600;
      case "m":
      case "min":
      case "minute":
      case "minutes":
        return parseInt(amount) * 60;
      case "s":
      case "sec":
      case "second":
      case "seconds":
      default:
        return parseInt(amount);
    }
  }
}

/**
 * Decodes a buffer blob into a string.
 *
 * @param {AllowSharedBufferSource | undefined} blob - The buffer blob to decode.
 * @returns {string} The decoded string. Returns an empty string if input is undefined.
 */
export function decodeBlob(blob: AllowSharedBufferSource | undefined): string {
  if (!blob) return ""; // Handle undefined or null values safely
  return new TextDecoder().decode(blob);
}

/**
 * Retrieves the first file name in the specified directory.
 *
 * @param {string} dirPath - The path of the directory to read.
 * @returns {Promise<string>} A promise that resolves to the full path of the first file in the directory.
 * @throws {Error} If the directory is empty or cannot be read.
 */
export async function getFirstDirFileName(dirPath: string): Promise<string> {
  const files = await fs.readdir(dirPath);
  const file = files[0];
  if (!file) {
    throw new Error(`No files in directory: ${dirPath}`);
  }
  return path.join(dirPath, file);
}
