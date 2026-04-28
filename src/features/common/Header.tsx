
interface Props {
  tab: string;
  t: (k: any) => string;
}

export function Header({ tab, t }: Props) {
  return (
    <div style={{ marginBottom: '5px', direction: 'ltr' }}>
      {tab === 'home' ? (
        <div>
          <h1 className="logo-text" style={{ margin: 0, fontSize: 'var(--logo-font-size)' }}>GYMLOG</h1>
          <div className="subtitle-text">{t('premiumSystem')}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0px', paddingLeft: '12px' }}>
          <h1 className="premium-title" style={{ margin: 0, fontSize: '32px' }}>
            {t(tab)}
          </h1>
        </div>
      )}
    </div>
  );
}
