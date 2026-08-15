export { loader } from "~/modules/auth/server/verify-otp-loader.server";
export { action } from "~/modules/auth/server/verify-otp-action.server";

import { VerifyOtpForm } from "~/modules/auth/components/verify-otp-form";

export default function VerifyOtpPage() {
  return <VerifyOtpForm />;
}
