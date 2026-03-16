declare module "date-fns-tz" {
  /**
   * Convert a UTC date to a Date in the given IANA time zone.
   */
  export function utcToZonedTime(
    date: Date | number,
    timeZone: string
  ): Date;

  /**
   * Convert a local date in the given IANA time zone to a UTC Date.
   */
  export function zonedTimeToUtc(
    date: Date | number,
    timeZone: string
  ): Date;
}

