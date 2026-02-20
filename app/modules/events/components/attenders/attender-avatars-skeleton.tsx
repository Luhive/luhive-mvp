import { Skeleton } from "~/shared/components/ui/skeleton"

export const AttendersAvatarsSkeleton = () => {
	return (
	  <div className='bg-background flex items-center w-fit rounded-full border p-1 shadow-sm'>
		<div className='flex -space-x-2'>
		  {[1, 2, 3, 4].map((i) => (
			<Skeleton
			  key={i}
			  className='h-8 w-8 rounded-full ring-background ring-2 bg-muted'
			/>
		  ))}
		</div>
		<Skeleton className='h-4 w-8 ml-2 rounded-full bg-muted' />
	  </div>
	)
  }