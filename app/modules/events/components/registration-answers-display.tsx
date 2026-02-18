import { Phone, MessageSquare } from 'lucide-react';
import type { CustomQuestionJson, CustomAnswerJson } from '~/modules/events/model/event.types';
import { formatPhoneNumber } from '~/modules/events/utils/custom-questions';

interface RegistrationAnswersDisplayProps {
  answers: CustomAnswerJson | null;
  questions: CustomQuestionJson | null;
}

export function RegistrationAnswersDisplay({
  answers,
  questions,
}: RegistrationAnswersDisplayProps) {
  if (!questions || !answers) {
    return (
      <div className="text-sm text-muted-foreground py-4">
        No custom questions configured for this event.
      </div>
    );
  }

  const hasPhone = questions.phone.enabled && answers.phone;
  const hasCustomQuestions =
    questions.custom && questions.custom.length > 0;

  if (!hasPhone && !hasCustomQuestions) {
    return (
      <div className="text-sm text-muted-foreground py-4">
        No custom questions configured for this event.
      </div>
    );
  }

  const hasAnyAnswers = hasPhone || 
    (hasCustomQuestions && questions.custom!.some((q) => answers[q.id]));

  if (!hasAnyAnswers) {
    return (
      <div className="text-sm text-muted-foreground py-4">
        No answers provided for custom questions.
      </div>
    );
  }

  return (
    <div className="space-y-4 py-2">
      {/* Phone Number */}
      {hasPhone && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Phone className="h-4 w-4 text-muted-foreground" />
            Phone Number
          </div>
          <div className="pl-6 text-sm">
            {formatPhoneNumber(answers.phone!)}
          </div>
        </div>
      )}

      {/* Custom Questions */}
      {hasCustomQuestions &&
        questions.custom!
          .sort((a, b) => a.order - b.order)
          .map((question) => {
            const answer = answers[question.id];
            if (!answer) return null;

            return (
              <div key={question.id} className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  {question.label}
                </div>
                <div className="pl-6 text-sm text-muted-foreground whitespace-pre-wrap">
                  {answer || '-'}
                </div>
              </div>
            );
          })}
    </div>
  );
}

