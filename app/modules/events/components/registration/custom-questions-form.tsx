import { useState, useEffect, useId } from 'react';
import { useIsMobile } from '~/shared/hooks/use-mobile';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/shared/components/ui/dialog';
import { FullscreenModal } from '~/shared/components/ui/fullscreen-modal';
import { Button } from '~/shared/components/ui/button';
import { Input } from '~/shared/components/ui/input';
import { Label } from '~/shared/components/ui/label';
import { Textarea } from '~/shared/components/ui/textarea';
import { Checkbox } from '~/shared/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/shared/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '~/shared/components/ui/avatar';
import { Separator } from '~/shared/components/ui/separator';
import { Spinner } from '~/shared/components/ui/spinner';
import { Phone, User, Mail } from 'lucide-react';
import type {
  CustomQuestionJson,
  CustomAnswerJson,
  DropdownOption,
} from '~/modules/events/model/event.types';
import {
  isValidPhoneNumber,
  formatPhoneNumber,
  validateCustomAnswers,
} from '~/modules/events/utils/custom-questions';
import { MAX_ANSWER_LENGTH } from '~/modules/events/utils/custom-questions-constants';
import { Form } from 'react-router';
import { cn } from '~/shared/lib/utils/cn';

const OVERLAY_FIELD_CLASS =
  'bg-muted/50 border-transparent shadow-none h-11 rounded-lg focus-visible:bg-background';

interface CustomQuestionsFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  customQuestions: CustomQuestionJson | null;
  /** When true, renders only the form content without Dialog/Drawer wrapper (for embedding in another modal) */
  inline?: boolean;
  variant?: 'default' | 'overlay';
  /** Rendered after the last question, before the submit button (e.g. Join Community checkbox) */
  afterQuestionsContent?: React.ReactNode;
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
  inline = false,
  variant = 'default',
  afterQuestionsContent,
}: CustomQuestionsFormProps) {
  const formId = useId();
  const isMobile = useIsMobile();
  const isOverlay = variant === 'overlay';
  const useInlineLayout = inline || isOverlay;
  const isAuthenticated = Boolean(userEmail || userName);
  const authenticatedFallbackName = userEmail?.split('@')[0]?.trim() || 'User';

  // Form state
  const [phone, setPhone] = useState('');
  const [customAnswers, setCustomAnswers] = useState<
    Record<string, string | DropdownOption | DropdownOption[]>
  >({});
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

  const handleCustomAnswerChange = (
    questionId: string,
    value: string | DropdownOption | DropdownOption[]
  ) => {
    setCustomAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));

    if (errors[questionId]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }
  };

  const handleMultiCheckboxChange = (
    questionId: string,
    option: DropdownOption,
    checked: boolean
  ) => {
    const current = customAnswers[questionId];
    const currentArray = Array.isArray(current) ? current : [];
    const updated = checked
      ? [...currentArray, option]
      : currentArray.filter((v) => v.id !== option.id);
    handleCustomAnswerChange(questionId, updated);
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
        const questionType = question.type ?? 'text';

        if (questionType === 'dropdown') {
          if (Array.isArray(answer) && answer.length > 0) {
            answers[question.id] = answer;
          } else if (
            answer &&
            typeof answer === 'object' &&
            !Array.isArray(answer) &&
            'id' in answer
          ) {
            answers[question.id] = answer;
          }
        } else if (typeof answer === 'string' && answer.trim()) {
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

  const displayName = isAuthenticated
    ? (userName?.trim() || authenticatedFallbackName)
    : anonymousName;
  const displayEmail = isAuthenticated ? userEmail : anonymousEmail;
  const displayAvatar = isAuthenticated ? userAvatarUrl : null;

  const hasQuestions = customQuestions && (
    customQuestions.phone.enabled ||
    (customQuestions.custom && customQuestions.custom.length > 0)
  );

  const formBody = (
    <div className={isOverlay ? 'space-y-6' : 'space-y-6'}>
      <div className={isOverlay ? undefined : 'space-y-4'}>
        <div
          className={
            isOverlay
              ? 'flex items-center gap-3'
              : 'flex items-center gap-4 p-4 bg-muted/50 rounded-lg'
          }
        >
          {displayAvatar ? (
            <Avatar className={isOverlay ? 'h-10 w-10' : 'h-12 w-12'}>
              <AvatarImage src={displayAvatar} alt={displayName} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {displayName?.substring(0, 2).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div
              className={
                isOverlay
                  ? 'h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center'
                  : 'h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center'
              }
            >
              <User className={isOverlay ? 'h-5 w-5 text-primary' : 'h-6 w-6 text-primary'} />
            </div>
          )}
          <div className="flex-1 min-w-0 space-y-0.5">
            <span className="font-semibold">{displayName}</span>
            {isOverlay ? (
              <p className="text-sm text-muted-foreground truncate">{displayEmail}</p>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                <span>{displayEmail}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {hasQuestions && (
        <>
          {!isOverlay && <Separator />}

          <div className="space-y-5 pb-0">
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
                    className={cn(
                      errors.phone ? 'border-destructive pl-10' : 'pl-10',
                      isOverlay && OVERLAY_FIELD_CLASS,
                    )}
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

            {/* Custom Questions */}
            {customQuestions.custom &&
              customQuestions.custom.length > 0 &&
              customQuestions.custom
                .sort((a, b) => a.order - b.order)
                .map((question) => {
                  const questionType = question.type ?? 'text';

                  if (questionType === 'dropdown' && question.allowMultiple) {
                    const selectedValues = Array.isArray(customAnswers[question.id])
                      ? (customAnswers[question.id] as DropdownOption[])
                      : [];
                    return (
                      <div key={question.id} className="space-y-2">
                        <Label>
                          {question.label}
                          {question.required && (
                            <span className="text-destructive ml-1">*</span>
                          )}
                        </Label>
                        <div className="space-y-2">
                          {(question.options ?? []).map((option) => (
                            <div key={option.id} className="flex items-center gap-2">
                              <Checkbox
                                id={`${question.id}-${option.id}`}
                                checked={selectedValues.some((v) => v.id === option.id)}
                                onCheckedChange={(checked) =>
                                  handleMultiCheckboxChange(
                                    question.id,
                                    option,
                                    checked === true
                                  )
                                }
                                disabled={isSubmitting}
                              />
                              <Label
                                htmlFor={`${question.id}-${option.id}`}
                                className="text-sm font-normal cursor-pointer"
                              >
                                {option.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                        {errors[question.id] && (
                          <p className="text-xs text-destructive">{errors[question.id]}</p>
                        )}
                      </div>
                    );
                  }

                  if (questionType === 'dropdown') {
                    const selectedOption =
                      customAnswers[question.id] &&
                      typeof customAnswers[question.id] === 'object' &&
                      !Array.isArray(customAnswers[question.id])
                        ? (customAnswers[question.id] as DropdownOption)
                        : null;
                    return (
                      <div key={question.id} className="space-y-2">
                        <Label htmlFor={`question-${question.id}`}>
                          {question.label}
                          {question.required && (
                            <span className="text-destructive ml-1">*</span>
                          )}
                        </Label>
                        <Select
                          value={selectedOption?.id ?? ''}
                          onValueChange={(optionId) => {
                            const option = (question.options ?? []).find(
                              (o) => o.id === optionId
                            );
                            if (option) {
                              handleCustomAnswerChange(question.id, option);
                            }
                          }}
                          disabled={isSubmitting}
                        >
                          <SelectTrigger
                            id={`question-${question.id}`}
                            className={cn(
                              'w-full',
                              errors[question.id] ? 'border-destructive' : '',
                              isOverlay && OVERLAY_FIELD_CLASS,
                            )}
                          >
                            <SelectValue placeholder="Select an option" />
                          </SelectTrigger>
                          <SelectContent>
                            {(question.options ?? []).map((option) => (
                              <SelectItem key={option.id} value={option.id}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors[question.id] && (
                          <p className="text-xs text-destructive">{errors[question.id]}</p>
                        )}
                      </div>
                    );
                  }

                  // Default: text question
                  const textValue =
                    typeof customAnswers[question.id] === 'string'
                      ? (customAnswers[question.id] as string)
                      : '';
                  return (
                    <div key={question.id} className="space-y-2">
                      <Label htmlFor={`question-${question.id}`}>
                        {question.label}
                        {question.required && (
                          <span className="text-destructive ml-1">*</span>
                        )}
                      </Label>
                      {isOverlay ? (
                        <Input
                          id={`question-${question.id}`}
                          name={`question-${question.id}`}
                          value={textValue}
                          onChange={(e) =>
                            handleCustomAnswerChange(question.id, e.target.value)
                          }
                          placeholder="Your answer..."
                          required={question.required}
                          disabled={isSubmitting}
                          maxLength={MAX_ANSWER_LENGTH}
                          className={cn(
                            errors[question.id] ? 'border-destructive' : '',
                            OVERLAY_FIELD_CLASS,
                          )}
                        />
                      ) : (
                        <Textarea
                          id={`question-${question.id}`}
                          name={`question-${question.id}`}
                          value={textValue}
                          onChange={(e) =>
                            handleCustomAnswerChange(question.id, e.target.value)
                          }
                          placeholder="Your answer..."
                          required={question.required}
                          disabled={isSubmitting}
                          maxLength={MAX_ANSWER_LENGTH}
                          rows={2}
                          className={errors[question.id] ? 'border-destructive' : ''}
                        />
                      )}
                      {errors[question.id] && (
                        <p className="text-xs text-destructive">{errors[question.id]}</p>
                      )}
                      {!isOverlay && textValue && (
                        <p className="text-xs text-muted-foreground">
                          {textValue.length}/{MAX_ANSWER_LENGTH} characters
                        </p>
                      )}
                    </div>
                  );
                })}
          </div>
        </>
      )}
    </div>
  );

  const submitButton = (
    <Button
      type="submit"
      form={formId}
      className="w-full"
      size="lg"
      disabled={isSubmitting}
    >
      {isSubmitting ? (
        <>
          <Spinner className="h-4 w-4 mr-2" />
          Submitting...
        </>
      ) : isOverlay ? (
        "Register"
      ) : (
        "Complete Registration"
      )}
    </Button>
  );

  if (useInlineLayout) {
    return (
      <Form
        id={formId}
        onSubmit={handleSubmit}
        className={isOverlay ? 'flex flex-col gap-8' : 'contents'}
      >
        <div
          className={
            isOverlay
              ? 'space-y-6'
              : 'flex-1 min-h-0 overflow-y-auto px-4 space-y-2 pb-4'
          }
        >
          {formBody}
          {afterQuestionsContent}
        </div>
        <div className={isOverlay ? undefined : 'px-4 py-4 shrink-0'}>
          {submitButton}
        </div>
      </Form>
    );
  }

  if (isMobile) {
    return (
      <FullscreenModal
        open={open}
        onOpenChange={onOpenChange}
        title="Complete Your Registration"
        footer={submitButton}
      >
        <Form
          id={formId}
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 min-h-0"
        >
          {formBody}
        </Form>
      </FullscreenModal>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4 pr-10 shrink-0">
          <DialogTitle>Complete Your Registration</DialogTitle>
          <DialogDescription>
            {hasQuestions
              ? "Please answer the following questions to complete your registration."
              : "Review your information and complete your registration."}
          </DialogDescription>
        </DialogHeader>
        <Form
          id={formId}
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 min-h-0 overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto px-6">{formBody}</div>
          <div className="px-6 py-4 shrink-0">{submitButton}</div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

