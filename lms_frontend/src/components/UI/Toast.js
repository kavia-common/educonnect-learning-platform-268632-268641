import { toast } from "react-hot-toast";

/**
 * PUBLIC_INTERFACE
 * A small wrapper around react-hot-toast for consistent messages across the app.
 * Use these helpers to ensure uniform copy, duration, and icons.
 */
export const Toast = {
  // PUBLIC_INTERFACE
  success(message = "Success", options = {}) {
    /** Show a standardized success toast. */
    return toast.success(message, {
      duration: 3500,
      ariaProps: { role: "status", "aria-live": "polite" },
      ...options,
    });
  },
  // PUBLIC_INTERFACE
  error(message = "Something went wrong", options = {}) {
    /** Show a standardized error toast. */
    return toast.error(message, {
      duration: 4500,
      ariaProps: { role: "alert", "aria-live": "assertive" },
      ...options,
    });
  },
  // PUBLIC_INTERFACE
  info(message = "", options = {}) {
    /** Show a standardized neutral toast. */
    return toast(message, {
      duration: 3000,
      ariaProps: { role: "status", "aria-live": "polite" },
      ...options,
    });
  },
};

export default Toast;
