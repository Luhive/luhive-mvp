import { useState } from 'react';
import { Label } from '~/components/ui/label';
import { Switch } from '~/components/ui/switch';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Checkbox } from '~/components/ui/checkbox';
import { Card, CardContent } from '~/components/ui/card';
import { Separator } from '~/components/ui/separator';
import { Phone, Plus, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { CustomQuestionJson, PhoneQuestionConfig, CustomQuestion } from '~/models/event.types';
import { createNewCustomQuestion } from '~/lib/utils/customQuestions';
import {
  MAX_CUSTOM_QUESTIONS,
  MIN_QUESTION_LABEL_LENGTH,
  MAX_QUESTION_LABEL_LENGTH,
} from '~/lib/constants/customQuestions';

interface CustomQuestionsBuilderProps {
  value: CustomQuestionJson | null;
  onChange: (value: CustomQuestionJson | null) => void;
}

export function CustomQuestionsBuilder({
  value,
  onChange,
}: CustomQuestionsBuilderProps) {
  const [phoneConfig, setPhoneConfig] = useState<PhoneQuestionConfig>(
    value?.phone || { enabled: false, required: false }
  );
  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>(
    value?.custom || []
  );

  const handlePhoneEnabledChange = (enabled: boolean) => {
    const newConfig: PhoneQuestionConfig = {
      enabled,
      required: enabled ? phoneConfig.required : false,
    };
    setPhoneConfig(newConfig);
    updateValue(newConfig, customQuestions);
  };

  const handlePhoneRequiredChange = (required: boolean) => {
    const newConfig: PhoneQuestionConfig = {
      ...phoneConfig,
      required,
    };
    setPhoneConfig(newConfig);
    updateValue(newConfig, customQuestions);
  };

  const handleAddQuestion = () => {
    if (customQuestions.length >= MAX_CUSTOM_QUESTIONS) {
      toast.error(`Maximum ${MAX_CUSTOM_QUESTIONS} custom questions allowed`);
      return;
    }

    const newQuestion = createNewCustomQuestion(customQuestions.length);
    const updatedQuestions = [...customQuestions, newQuestion];
    setCustomQuestions(updatedQuestions);
    updateValue(phoneConfig, updatedQuestions);
  };

  const handleDeleteQuestion = (questionId: string) => {
    const updatedQuestions = customQuestions
      .filter((q) => q.id !== questionId)
      .map((q, index) => ({ ...q, order: index }));
    setCustomQuestions(updatedQuestions);
    updateValue(phoneConfig, updatedQuestions);
  };

  const handleQuestionLabelChange = (questionId: string, label: string) => {
    const updatedQuestions = customQuestions.map((q) =>
      q.id === questionId ? { ...q, label } : q
    );
    setCustomQuestions(updatedQuestions);
    updateValue(phoneConfig, updatedQuestions);
  };

  const handleQuestionRequiredChange = (questionId: string, required: boolean) => {
    const updatedQuestions = customQuestions.map((q) =>
      q.id === questionId ? { ...q, required } : q
    );
    setCustomQuestions(updatedQuestions);
    updateValue(phoneConfig, updatedQuestions);
  };

  const updateValue = (
    phone: PhoneQuestionConfig,
    custom: CustomQuestion[]
  ) => {
    if (!phone.enabled && custom.length === 0) {
      onChange(null);
    } else {
      onChange({
        phone,
        custom,
      });
    }
  };

  const validateQuestionLabel = (label: string): string | null => {
    if (label.trim().length < MIN_QUESTION_LABEL_LENGTH) {
      return `Question must be at least ${MIN_QUESTION_LABEL_LENGTH} characters`;
    }
    if (label.trim().length > MAX_QUESTION_LABEL_LENGTH) {
      return `Question must be no more than ${MAX_QUESTION_LABEL_LENGTH} characters`;
    }
    return null;
  };

  const hasInvalidQuestions = customQuestions.some(
    (q) => q.label.trim() && validateQuestionLabel(q.label) !== null
  );

  return (
    <div className="space-y-6">
      {/* Phone Number Collection */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="phone-toggle" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Collect Phone Number
            </Label>
            <p className="text-sm text-muted-foreground">
              Ask registrants for their phone number
            </p>
          </div>
          <Switch
            id="phone-toggle"
            checked={phoneConfig.enabled}
            onCheckedChange={handlePhoneEnabledChange}
          />
        </div>

        {phoneConfig.enabled && (
          <div className="space-y-2 pl-6 border-l-2 border-muted">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="phone-required">Required</Label>
                <p className="text-sm text-muted-foreground">
                  Make phone number mandatory for registration
                </p>
              </div>
              <Switch
                id="phone-required"
                checked={phoneConfig.required}
                onCheckedChange={handlePhoneRequiredChange}
              />
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Custom Questions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Custom Questions</Label>
            <p className="text-sm text-muted-foreground">
              Add up to {MAX_CUSTOM_QUESTIONS} custom text questions
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddQuestion}
            disabled={customQuestions.length >= MAX_CUSTOM_QUESTIONS}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Button>
        </div>

        {customQuestions.length === 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground border border-dashed rounded-lg">
            No custom questions added yet. Click "Add Question" to get started.
          </div>
        )}

        {customQuestions.length > 0 && (
          <div className="space-y-3">
            {customQuestions.map((question, index) => {
              const validationError = validateQuestionLabel(question.label);
              const showError = question.label.trim() && validationError;

              return (
                <Card key={question.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`question-${question.id}`}>
                            Question {index + 1}
                          </Label>
                          {showError && (
                            <div className="flex items-center gap-1 text-xs text-destructive">
                              <AlertCircle className="h-3 w-3" />
                              {validationError}
                            </div>
                          )}
                        </div>
                        <Input
                          id={`question-${question.id}`}
                          value={question.label}
                          onChange={(e) =>
                            handleQuestionLabelChange(question.id, e.target.value)
                          }
                          placeholder="Enter your question (5-200 characters)"
                          maxLength={MAX_QUESTION_LABEL_LENGTH}
                          className={showError ? 'border-destructive' : ''}
                        />
                        <p className="text-xs text-muted-foreground">
                          {question.label.length}/{MAX_QUESTION_LABEL_LENGTH} characters
                          {question.label.length > 0 &&
                            question.label.length < MIN_QUESTION_LABEL_LENGTH && (
                              <span className="text-destructive ml-2">
                                (minimum {MIN_QUESTION_LABEL_LENGTH} characters)
                              </span>
                            )}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteQuestion(question.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete question</span>
                      </Button>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`required-${question.id}`}
                        checked={question.required}
                        onCheckedChange={(checked) =>
                          handleQuestionRequiredChange(
                            question.id,
                            checked === true
                          )
                        }
                      />
                      <Label
                        htmlFor={`required-${question.id}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        Required field
                      </Label>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {customQuestions.length >= MAX_CUSTOM_QUESTIONS && (
          <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Maximum of {MAX_CUSTOM_QUESTIONS} custom questions reached</span>
          </div>
        )}
      </div>
    </div>
  );
}

