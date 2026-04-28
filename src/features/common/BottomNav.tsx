import React from 'react';

interface NavItem {
  key: string;
  icon: React.ReactNode;
  label: string;
}

interface Props {
  items: NavItem[];
  activeTab: string;
  onTabChange: (tab: any) => void;
}

export const BottomNav: React.FC<Props> = ({ items, activeTab, onTabChange }) => {
  return (
    <nav className="bottom-nav">
      {items.map(item => (
        <button
          key={item.key}
          className={`nav-btn ${activeTab === item.key ? 'active' : ''}`}
          onClick={() => onTabChange(item.key)}
        >
          {item.icon}
        </button>
      ))}
    </nav>
  );
};
