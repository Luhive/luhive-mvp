import { Skeleton } from "~/shared/components/ui/skeleton";
import {
  communityGridClassName,
  eventGridClassName,
} from "~/modules/hub/components/v2/hub-grid-layout";

type SkeletonCountProps = {
  count: number;
};

export function CommunityGridSkeleton({ count }: SkeletonCountProps) {
  return (
    <div className={communityGridClassName} aria-hidden>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="rounded-[26px] bg-[#f6f6f6] p-1 shadow-[0px_16px_32px_-10px_rgba(0,0,0,0.1)]"
        >
          <div className="flex flex-col gap-[34px] rounded-[24px] bg-white p-4">
            <div className="flex items-start justify-between">
              <Skeleton className="size-12 rounded-[8px] bg-[#f1f1f3]" />
              <Skeleton className="size-9 rounded-full bg-[#f5f5f7]" />
            </div>
            <div className="flex flex-col gap-[14px]">
              <Skeleton className="h-[13px] w-3/5 rounded-full bg-[#f1f1f3]" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-3 w-full rounded-full bg-[#f5f5f7]" />
                <Skeleton className="h-3 w-11/12 rounded-full bg-[#f5f5f7]" />
                <Skeleton className="h-3 w-2/5 rounded-full bg-[#f5f5f7]" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function EventGridSkeleton({ count }: SkeletonCountProps) {
  return (
    <div className={eventGridClassName} aria-hidden>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex flex-col gap-5">
          <Skeleton className="aspect-square w-full rounded-[12px] bg-[#f3f3f5]" />
          <div className="flex flex-col gap-[14px]">
            <Skeleton className="h-3 w-3/4 rounded-full bg-[#f3f3f5]" />
            <Skeleton className="h-[15px] w-11/12 rounded-full bg-[#f1f1f3]" />
            <Skeleton className="h-3 w-1/2 rounded-full bg-[#f3f3f5]" />
          </div>
        </div>
      ))}
    </div>
  );
}
