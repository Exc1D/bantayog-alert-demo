import Modal from './Modal';
import Button from './Button';

export default function SignUpPromptModal({ isOpen, onClose, onSignUpNow }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Want more from Bantayog Alert?"
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        <p className="text-sm text-textLight leading-relaxed">
          Do you want more? Sign up to unlock upvotes, comments, and a personalized community
          experience.
        </p>

        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Later
          </Button>
          <Button className="flex-1" onClick={onSignUpNow}>
            Sign Up
          </Button>
        </div>
      </div>
    </Modal>
  );
}
