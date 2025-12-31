import { Component, JSX } from 'solid-js';
import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning';
}

export const ConfirmDialog: Component<ConfirmDialogProps> = (props) => {
  const handleConfirm = () => {
    props.onConfirm();
    props.onClose();
  };

  return (
    <Modal open={props.isOpen} onClose={props.onClose} title={props.title}>
      <div class="space-y-4">
        <p class="text-gray-700 dark:text-gray-900">{props.message}</p>
        
        <div class="flex justify-end gap-3 pt-4">
          <Button
            variant="secondary"
            onClick={props.onClose}
          >
            {props.cancelText || 'Cancel'}
          </Button>
          <Button
            variant={props.variant === 'danger' ? 'danger' : 'primary'}
            onClick={handleConfirm}
          >
            {props.confirmText || 'Confirm'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
