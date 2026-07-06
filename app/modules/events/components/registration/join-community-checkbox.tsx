import { Checkbox } from "~/shared/components/ui/checkbox";

interface JoinCommunityCheckboxProps {
  id: string;
  communityName: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function JoinCommunityCheckbox({
  id,
  communityName,
  checked,
  onCheckedChange,
  disabled = false,
}: JoinCommunityCheckboxProps) {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
        disabled={disabled}
      />
      <label
        htmlFor={id}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        Become a member of {communityName}?
      </label>
    </div>
  );
}
