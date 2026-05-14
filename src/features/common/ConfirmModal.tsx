
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
      <div className="glass-panel" style={{ 
        width: '85%', 
        maxWidth: '340px', 
        padding: '28px 24px', 
        textAlign: 'center', 
        borderRadius: '24px',
        background: 'rgba(var(--primary-bg-rgb, 10, 10, 12), 0.85)', // Much more solid
        backdropFilter: 'blur(35px)', // Stronger blur
        WebkitBackdropFilter: 'blur(35px)',
        border: '1px solid rgba(var(--theme-rgb), 0.15)'
      }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>🗑️</div>
        <div className="premium-title" style={{ fontSize: '32px', marginBottom: '8px' }}>
          {title.toUpperCase()}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}>{message}</div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onCancel} className="glass-button" style={{ 
            flex: 1, borderRadius: '12px', justifyContent: 'center', height: '48px', padding: 0 
          }}>{cancelLabel}</button>
          <button onClick={onConfirm} className="danger-button" style={{ 
            flex: 1, borderRadius: '12px', justifyContent: 'center', height: '48px', padding: 0 
          }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
export default ConfirmModal;
