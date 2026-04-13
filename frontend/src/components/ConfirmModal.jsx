import React from 'react';
import '../styles/ConfirmModal.css';

/**
 * Reusable confirm dialog — replaces window.confirm() everywhere.
 *
 * Props:
 *   open     boolean  — whether the modal is visible
 *   title    string   — dialog heading
 *   message  node     — body text (can contain JSX)
 *   confirmLabel string  (default "Delete")
 *   cancelLabel  string  (default "Cancel")
 *   variant  'danger' | 'warning' | 'info'  (default 'danger')
 *   onConfirm  () => void
 *   onCancel   () => void
 */
const ConfirmModal = ({
    open,
    title = 'Are you sure?',
    message,
    confirmLabel = 'Delete',
    cancelLabel = 'Cancel',
    variant = 'danger',
    onConfirm,
    onCancel,
}) => {
    if (!open) return null;

    const icons = {
        danger: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="26" height="26">
                <path strokeLinecap="round" strokeLinejoin="round"
                    d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            </svg>
        ),
        warning: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="26" height="26">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
        ),
        info: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="26" height="26">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
        ),
    };

    return (
        <div className="cm-overlay" onClick={onCancel}>
            <div className={`cm-modal cm-modal--${variant}`} onClick={e => e.stopPropagation()}>
                <div className={`cm-icon cm-icon--${variant}`}>{icons[variant]}</div>
                <h3 className="cm-title">{title}</h3>
                {message && <p className="cm-message">{message}</p>}
                <div className="cm-actions">
                    <button className="cm-btn cm-btn--cancel" onClick={onCancel}>{cancelLabel}</button>
                    <button className={`cm-btn cm-btn--${variant}`} onClick={onConfirm}>{confirmLabel}</button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
