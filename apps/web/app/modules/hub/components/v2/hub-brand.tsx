import { Link } from "react-router";
import { Routes } from "~/shared/lib/routing/routes";
import luhiveMark from "~/assets/images/hub-v2/luhive-mark.svg";

export function HubBrand() {
  return (
    <Link
      to={Routes.hubV2}
      prefetch="intent"
      aria-label="Luhive hub"
      className="flex items-center gap-[5.65px] rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[#111]/15"
    >
      <span className="relative size-[24px] shrink-0">
        <img
          src={luhiveMark}
          alt=""
          width={24.1694}
          height={24.1694}
          className="absolute left-[-0.35%] top-[-0.35%] block max-w-none"
        />
      </span>
      <span className="font-geologica text-[33.882px] font-medium leading-none tracking-[-1.3553px] text-[#141414] [text-box-edge:cap_alphabetic] [text-box-trim:trim-both]">
        Luhive
      </span>
    </Link>
  );
}
