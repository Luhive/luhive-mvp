import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '~/shared/components/ui/avatar';
import { Spinner } from '~/shared/components/ui/spinner';
import { uploadCommunityLogo } from '~/shared/lib/storage/object-storage.client';
import { createClient } from '~/shared/lib/supabase/client';
import { toast } from 'sonner';
import { Camera } from 'lucide-react';
import { useRevalidator } from 'react-router';

interface ProfilePictureUploadProps {
	communitySlug: string;
	currentLogoUrl?: string;
	communityName: string;
	onLogoUpdate: (newLogoUrl: string) => void;
}

export function ProfilePictureUpload({
	communitySlug,
	currentLogoUrl = '',
	communityName,
	onLogoUpdate
}: ProfilePictureUploadProps) {
	const [previewImage, setPreviewImage] = useState<string>(currentLogoUrl);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [isClient, setIsClient] = useState(false);

	// Ensure component only renders on client side
	useEffect(() => {
		setIsClient(true);
	}, []);

	const revalidator = useRevalidator()

	const getInitials = (name: string) => {
		return name
			.split(' ')
			.map(word => word[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	};

	const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		// Show preview immediately
		const reader = new FileReader();
		reader.onloadend = () => {
			setPreviewImage(reader.result as string);
		};
		reader.readAsDataURL(file);

		// Upload to Supabase Storage
		setIsUploading(true);
		setUploadProgress(0);

		try {
			// Simulate progress
			const progressInterval = setInterval(() => {
				setUploadProgress(prev => Math.min(prev + 10, 90));
			}, 100);

			const result = await uploadCommunityLogo(file, communitySlug);



			clearInterval(progressInterval);
			setUploadProgress(100);

			if (result.success && result.url) {
				setPreviewImage(result.url);
				onLogoUpdate(result.url);

				// Update the community logo_url in the database
				try {
					const supabase = createClient();
					const { error: dbError } = await supabase
						.from('communities')
						.update({ logo_url: result.url })
						.eq('slug', communitySlug);

					if (dbError) {
						console.error('Database update error:', dbError);
						toast.error('Logo uploaded but failed to save to database');
					} else {
						toast.success('Logo uploaded and saved successfully!');
					}
				} catch (dbError) {
					console.error('Database update error:', dbError);
					toast.error('Logo uploaded but failed to save to database');
				}
			} else {
				toast.error(result.error || 'Upload failed');
				// Reset preview to original
				setPreviewImage(currentLogoUrl);
			}
		} catch (error) {
			toast.error('Upload failed. Please try again.');
			console.log(error)
			setPreviewImage(currentLogoUrl);
		} finally {
			revalidator.revalidate()
			setIsUploading(false);
			setUploadProgress(0);
		}
	};

	// Don't render until client-side
	if (!isClient) {
		return (
			<div className="flex flex-col items-center mb-6">
				<div className="relative">
					<Avatar className="h-24 w-24 border-1">
						<AvatarImage src={currentLogoUrl} alt={communityName} />
						<AvatarFallback className="text-2xl bg-primary/10 text-primary">
							{communityName.substring(0, 2).toUpperCase()}
						</AvatarFallback>
					</Avatar>
				</div>
				<div className="mt-2 text-center">
					<div className="text-xs text-muted-foreground">
						Loading...
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col items-center mb-6">
			<div className="relative">
				<Avatar className="h-24 w-24 border-1">
					<AvatarImage src={currentLogoUrl} alt={communityName} />
					<AvatarFallback className="text-2xl bg-primary/10 text-primary">
						{communityName.substring(0, 2).toUpperCase()}
					</AvatarFallback>
				</Avatar>

				{/* Upload Progress Overlay */}
				{isUploading && (
					<div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
						<div className="text-white text-xs font-medium">
							{uploadProgress}%
						</div>
					</div>
				)}

				<label
					htmlFor="profile-upload"
					className={`absolute bottom-0 right-0 p-2 rounded-full cursor-pointer transition-colors shadow-lg ${isUploading
							? 'bg-muted text-muted-foreground cursor-not-allowed'
							: 'bg-primary text-primary-foreground hover:bg-primary/90'
						}`}
				>
					{isUploading ? (
						<Spinner className="h-4 w-4" />
					) : (
						<Camera className="h-4 w-4" />
					)}
					<input
						id="profile-upload"
						type="file"
						accept="image/*"
						className="hidden"
						onChange={handleImageUpload}
						disabled={isUploading}
					/>
				</label>
			</div>

			{/* Upload Status */}
			{isUploading && (
				<div className="mt-2 text-center">
					<div className="text-sm text-muted-foreground">Uploading...</div>
					<div className="w-32 bg-muted rounded-full h-1 mt-1">
						<div
							className="bg-primary h-1 rounded-full transition-all duration-300"
							style={{ width: `${uploadProgress}%` }}
						/>
					</div>
				</div>
			)}

			{!isUploading && (
				<div className="mt-4 text-center">
					<div className="text-xs text-muted-foreground">
						Click camera icon to change logo
					</div>
				</div>
			)}
		</div>
	);
}
