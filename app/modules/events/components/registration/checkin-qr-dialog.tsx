import { useState } from "react";
import { QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "~/shared/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "~/shared/components/ui/dialog";
import { cn } from "~/shared/lib/utils";

interface CheckinQrDialogProps {
	checkinToken: string;
	className?: string;
}

export function CheckinQrDialog({ checkinToken, className }: CheckinQrDialogProps) {
	const [open, setOpen] = useState(false);

	return (
		<>
			<Button
				type="button"
				variant="outline"
				size="sm"
				className={cn("shrink-0 h-8", className)}
				onClick={() => setOpen(true)}
			>
				<QrCode className="h-4 w-4" />
				Your QR
			</Button>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="sm:max-w-xs">
					<DialogHeader>
						<DialogTitle>Your Check-in QR</DialogTitle>
					</DialogHeader>
					<div className="flex justify-center rounded-md bg-white p-4 border">
						<QRCodeSVG value={checkinToken} size={200} />
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
