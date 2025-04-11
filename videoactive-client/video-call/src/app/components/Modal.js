import React from 'react';
/**
 * Modal component that displays a confirmation dialog with a message and two buttons.
 *
 * This component performs the following actions:
 * - Displays the modal when `isOpen` is `true`.
 * - Shows the provided `message` inside the modal.
 * - Includes two buttons: 
 *    - "Cancel" button that triggers the `onClose` function to close the modal.
 *    - "Confirm" button that triggers the `onConfirm` function to confirm the action.
 * - The modal is displayed with a semi-transparent black background overlay.
 *
 * @param {Object} props - The props passed to the component.
 * @param {boolean} props.isOpen - A flag indicating if the modal should be displayed.
 * @param {function} props.onClose - The function to close the modal when the "Cancel" button is clicked.
 * @param {function} props.onConfirm - The function to confirm the action when the "Confirm" button is clicked.
 * @param {string} props.message - The message to display inside the modal.
 * @returns {JSX.Element|null} The rendered Modal component or null if `isOpen` is false.
 */
const Modal = ({ isOpen, onClose, onConfirm, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <p>{message}</p>
        <div className="mt-4 flex justify-end space-x-4">
          <button
            className="bg-gray-400 text-gray-700 px-4 py-2 rounded-lg"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="bg-blue-500 text-gray-700 px-4 py-2 rounded-lg"
            onClick={onConfirm}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;