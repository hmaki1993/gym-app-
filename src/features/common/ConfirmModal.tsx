
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
    <div style={{ 
      position: 'fixed', 
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)', 
      backdropFilter: 'blur(15px)',
      WebkitBackdropFilter: 'blur(15px)',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      zIndex: 999999,
      padding: '20px',
      animation: 'fadeIn 0.3s ease'
    }}>
      <div className="glass-panel" style={{ 
        width: '100%',
        maxWidth: '340px', 
        padding: '40px 24px', 
        textAlign: 'center', 
        borderRadius: '32px',
        background: 'rgba(10, 10, 12, 0.95)',
        border: '1.5px solid rgba(230, 126, 34, 0.4)',
        
        position: 'relative',
        animation: 'elite-expand 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px',  }}>⚠️</div>
        <h2 className="heading-font logo-underline" style={{ fontSize: '28px', marginBottom: '16px', color: '#fff', textAlign: 'center', letterSpacing: '-0.5px' }}>
          {title.toUpperCase()}
        </h2>
        <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.7)', marginBottom: '36px', lineHeight: '1.6', fontWeight: '500' }}>{message}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={onConfirm} style={{ 
            background: 'rgba(230, 126, 34, 0.1)', color: '#ff3366', border: '1px solid rgba(230, 126, 34, 0.5)', padding: '12px', borderRadius: '14px', fontWeight: '950', fontSize: '11px', letterSpacing: '2px', cursor: 'pointer', transition: 'all 0.3s ease' 
          }}>{confirmLabel}</button>
          <button onClick={onCancel} style={{ 
            background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '14px', fontWeight: '800', fontSize: '10px', cursor: 'pointer', transition: 'all 0.3s ease' 
          }}>{cancelLabel}</button>
        </div>
      </div>
    </div>
  );
}
export default ConfirmModal;
