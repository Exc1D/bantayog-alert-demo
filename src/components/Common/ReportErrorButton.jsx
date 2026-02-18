import { useState } from 'react';
import { showReportDialog } from '../../utils/sentry';
import Button from './Button';

export function ReportErrorButton({
  eventId,
  onReported,
  buttonText = 'Report Issue',
  className = '',
}) {
  const [isReporting, setIsReporting] = useState(false);

  const handleReport = () => {
    setIsReporting(true);
    
    showReportDialog({
      eventId,
      title: 'Report an Issue',
      subtitle: 'Help us improve by describing what happened.',
      subtitle2: 'Our team will review your feedback.',
      labelName: 'Your Name',
      labelEmail: 'Your Email',
      labelComments: 'What happened?',
      labelClose: 'Close',
      labelSubmit: 'Submit Report',
      errorGeneric: 'An unknown error occurred while submitting your report.',
      errorFormEntry: 'Some fields were invalid.',
      successMessage: 'Thank you for your feedback!',
      onLoad: () => setIsReporting(false),
      onClose: () => {
        setIsReporting(false);
        onReported?.();
      },
    });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleReport}
      disabled={isReporting}
      className={className}
    >
      {isReporting ? 'Opening...' : buttonText}
    </Button>
  );
}

export function ReportErrorForm({ onSubmit, onCancel }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      onSubmit?.({ name, email, comments });
      setSubmitted(true);
    } catch (error) {
      console.error('Failed to submit error report:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-4">
        <div className="text-green-600 mb-2">Thank you for your feedback!</div>
        <Button variant="outline" size="sm" onClick={onCancel}>
          Close
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="reporter-name" className="block text-sm font-medium text-gray-700 mb-1">
          Your Name
        </label>
        <input
          id="reporter-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Optional"
        />
      </div>

      <div>
        <label htmlFor="reporter-email" className="block text-sm font-medium text-gray-700 mb-1">
          Your Email
        </label>
        <input
          id="reporter-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="For follow-up updates"
        />
      </div>

      <div>
        <label htmlFor="reporter-comments" className="block text-sm font-medium text-gray-700 mb-1">
          What happened?
        </label>
        <textarea
          id="reporter-comments"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Describe the issue you encountered..."
          required
        />
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting || !comments.trim()}>
          {isSubmitting ? 'Submitting...' : 'Submit Report'}
        </Button>
      </div>
    </form>
  );
}

export default ReportErrorButton;
