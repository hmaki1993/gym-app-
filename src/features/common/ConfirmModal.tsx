
interface Props {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({ title, message, confirmLabel, cancelLabel, onConfirm, onCancel }: Props) {
  return (
    <div className="modal-overlay" style={{ alignItems: 'center' }}>
      <div className="glass-panel" style={{ width: '85%', maxWidth: '340px', padding: '28px 24px', textAlign: 'center', borderRadius: '20px' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>🗑️</div>
        <div className="premium-title" style={{ fontSize: '32px', marginBottom: '8px' }}>
          {title.toUpperCase()}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}>{message}</div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onCancel} className="glass-button" style={{ flex: 1, borderRadius: '12px' }}>{cancelLabel}</button>
          <button onClick={onConfirm} className="danger-button" style={{ flex: 1, borderRadius: '12px' }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
