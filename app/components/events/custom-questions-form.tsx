import { useState, useEffect } from 'react';
import { useIsMobile } from '~/hooks/use-mobile';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '~/components/ui/drawer';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Textarea } from '~/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { Separator } from '~/components/ui/separator';
import { Phone, User, Mail } from 'lucide-react';
import type { CustomQuestionJson, CustomAnswerJson } from '~/models/event.types';
import {
  isValidPhoneNumber,
  formatPhoneNumber,
  validateCustomAnswers,
} from '~/lib/utils/customQuestions';
import { MAX_ANSWER_LENGTH } from '~/lib/constants/customQuestions';
import { Form } from 'react-router';

interface CustomQuestionsFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  customQuestions: CustomQuestionJson | null;
  // For authenticated users
  userName?: string;
  userEmail?: string;
  userAvatarUrl?: string | null;
  userPhone?: string | null; // From profiles.metadata.phone
  // For anonymous users (after name/email collection)
  anonymousName?: string;
  anonymousEmail?: string;
  onSubmit: (answers: CustomAnswerJson) => void;
  isSubmitting?: boolean;
}

export function CustomQuestionsForm({
  open,
  onOpenChange,
  eventId,
  customQuestions,
  userName,
  userEmail,
  userAvatarUrl,
  userPhone,
  anonymousName,
  anonymousEmail,
  onSubmit,
  isSubmitting = false,
}: CustomQuestionsFormProps) {
  const isMobile = useIsMobile();
  const isAuthenticated = !!userName;

  // Form state
  const [phone, setPhone] = useState('');
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize phone from user profile if authenticated
  useEffect(() => {
    if (isAuthenticated && userPhone && !phone) {
      setPhone(userPhone);
    }
  }, [isAuthenticated, userPhone, phone]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setPhone('');
      setCustomAnswers({});
      setErrors({});
    }
  }, [open]);

  const handlePhoneChange = (value: string) => {
    // Remove all non-digit characters except +
    let cleaned = value.replace(/[^\d+]/g, '');
    
    // Ensure it starts with +
    if (cleaned && !cleaned.startsWith('+')) {
      cleaned = '+' + cleaned.replace(/\+/g, '');
    }
    
    setPhone(cleaned);
    
    // Clear error when user starts typing
    if (errors.phone) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.phone;
        return newErrors;
      });
    }
  };

  const handlePhoneBlur = () => {
    if (phone && !isValidPhoneNumber(phone)) {
      setErrors((prev) => ({
        ...prev,
        phone: 'Please enter a valid phone number in international format (e.g., +994501234567)',
      }));
    }
  };

  const handleCustomAnswerChange = (questionId: string, value: string) => {
    setCustomAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));

    // Clear error when user starts typing
    if (errors[questionId]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customQuestions) {
      onSubmit({});
      return;
    }

    // Build answers object
    const answers: CustomAnswerJson = {};
    
    if (customQuestions.phone.enabled && phone.trim()) {
      answers.phone = phone.trim();
    }

    // Add custom question answers
    if (customQuestions.custom && customQuestions.custom.length > 0) {
      for (const question of customQuestions.custom) {
        const answer = customAnswers[question.id];
        if (answer && answer.trim()) {
          answers[question.id] = answer.trim();
        }
      }
    }

    // Validate
    const validation = validateCustomAnswers(answers, customQuestions);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    // Submit - the parent component will handle the form submission
    onSubmit(answers);
  };

  const displayName = isAuthenticated ? userName : anonymousName;
  const displayEmail = isAuthenticated ? userEmail : anonymousEmail;
  const displayAvatar = isAuthenticated ? userAvatarUrl : null;

  const hasQuestions = customQuestions && (
    customQuestions.phone.enabled ||
    (customQuestions.custom && customQuestions.custom.length > 0)
  );

  const content = (
    <Form onSubmit={handleSubmit} className="space-y-6">

      {/* User Info Section (Read-only) */}
      <div className="space-y-4">
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
          {displayAvatar ? (
            <Avatar className="h-12 w-12">
              <AvatarImage src={displayAvatar} alt={displayName} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {displayName?.substring(0, 2).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
          )}
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{displayName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              <span>{displayEmail}</span>
            </div>
          </div>
        </div>
      </div>

      {hasQuestions && (
        <>
          <Separator />
          
          {/* Custom Questions Section */}
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {/* Phone Number Field */}
            {customQuestions.phone.enabled && (
              <div className="space-y-2">
                <Label htmlFor="phone">
                  Phone Number
                  {customQuestions.phone.required && (
                    <span className="text-destructive ml-1">*</span>
                  )}
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    onBlur={handlePhoneBlur}
                    placeholder="+994501234567"
                    required={customQuestions.phone.required}
                    disabled={isSubmitting}
                    className={errors.phone ? 'border-destructive pl-10' : 'pl-10'}
                  />
                </div>
                {errors.phone && (
                  <p className="text-xs text-destructive">{errors.phone}</p>
                )}
                {phone && !errors.phone && (
                  <p className="text-xs text-muted-foreground">
                    {formatPhoneNumber(phone)}
                  </p>
                )}
              </div>
            )}

            {/* Custom Text Questions */}
            {customQuestions.custom &&
              customQuestions.custom.length > 0 &&
              customQuestions.custom
                .sort((a, b) => a.order - b.order)
                .map((question) => (
                  <div key={question.id} className="space-y-2">
                    <Label htmlFor={`question-${question.id}`}>
                      {question.label}
                      {question.required && (
                        <span className="text-destructive ml-1">*</span>
                      )}
                    </Label>
                    <Textarea
                      id={`question-${question.id}`}
                      name={`question-${question.id}`}
                      value={customAnswers[question.id] || ''}
                      onChange={(e) =>
                        handleCustomAnswerChange(question.id, e.target.value)
                      }
                      placeholder="Your answer..."
                      required={question.required}
                      disabled={isSubmitting}
                      maxLength={MAX_ANSWER_LENGTH}
                      rows={3}
                      className={errors[question.id] ? 'border-destructive' : ''}
                    />
                    {errors[question.id] && (
                      <p className="text-xs text-destructive">
                        {errors[question.id]}
                      </p>
                    )}
                    {customAnswers[question.id] && (
                      <p className="text-xs text-muted-foreground">
                        {customAnswers[question.id].length}/{MAX_ANSWER_LENGTH} characters
                      </p>
                    )}
                  </div>
                ))}
          </div>

          <Separator />
        </>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Submitting...' : 'Complete Registration'}
      </Button>
    </Form>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>Complete Your Registration</DrawerTitle>
            <DrawerDescription>
              {hasQuestions
                ? 'Please answer the following questions to complete your registration.'
                : 'Review your information and complete your registration.'}
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4 overflow-y-auto">{content}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Complete Your Registration</DialogTitle>
          <DialogDescription>
            {hasQuestions
              ? 'Please answer the following questions to complete your registration.'
              : 'Review your information and complete your registration.'}
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto flex-1">{content}</div>
      </DialogContent>
    </Dialog>
  );
}

