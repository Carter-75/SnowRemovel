/**
 * Simple honeypot field to prevent basic bot submissions
 * Add this to forms to catch automated spam
 */

export interface HoneypotFieldProps {
  name?: string;
  value?: string;
  onChange?: (value: string) => void;
}

/**
 * Invisible honeypot input field
 * Bots will fill this, humans won't see it
 */
export function HoneypotField({ 
  name = "website", 
  value = "", 
  onChange 
}: HoneypotFieldProps) {
  return (
    <div
      style={{
        position: "absolute",
        left: "-9999px",
        width: "1px",
        height: "1px",
        overflow: "hidden",
      }}
      aria-hidden="true"
      tabIndex={-1}
    >
      <label htmlFor={name}>
        Website (leave blank)
      </label>
      <input
        type="text"
        id={name}
        name={name}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
      />
    </div>
  );
}

/**
 * Server-side validation for honeypot field
 * Returns true if submission appears to be from a bot
 */
export function isHoneypotFilled(honeypotValue: string | undefined): boolean {
  return Boolean(honeypotValue && honeypotValue.trim().length > 0);
}

/**
 * Time-based validation to prevent instant form submissions
 * Returns true if submission was too fast (likely bot)
 */
export function isSubmissionTooFast(
  formLoadTime: number,
  submissionTime: number,
  minimumSeconds: number = 3
): boolean {
  const elapsedMs = submissionTime - formLoadTime;
  return elapsedMs < minimumSeconds * 1000;
}
