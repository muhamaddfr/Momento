import React from 'react';
import { Home, Calendar, Sparkles, User } from 'lucide-react';

export default function NavigationBar({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'home', label: 'Hari Ini', icon: Home },
    { id: 'timeline', label: 'Linimasa', icon: Calendar },
    { id: 'flashback', label: 'Kenangan', icon: Sparkles },
    { id: 'profile', label: 'Profil', icon: User },
  ];

  return (
    <nav className="glass-panel" style={styles.navBar}>
      {tabs.map((tab) => {
        const IconComponent = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              ...styles.navButton,
              color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
            }}
          >
            <div style={styles.iconContainer}>
              <IconComponent 
                size={22} 
                style={{
                  ...styles.icon,
                  transform: isActive ? 'scale(1.15)' : 'scale(1)',
                  transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                }} 
              />
              {isActive && <div style={styles.activeDot} />}
            </div>
            <span style={{
              ...styles.label,
              color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: isActive ? '700' : '500',
            }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

const styles = {
  navBar: {
    position: 'fixed',
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    maxWidth: '480px',
    height: '76px',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: '8px 12px calc(8px + var(--safe-area-bottom)) 12px',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderTopLeftRadius: '24px',
    borderTopRightRadius: '24px',
    zIndex: 100,
    borderBottom: 'none',
  },
  navButton: {
    background: 'none',
    border: 'none',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    cursor: 'pointer',
    gap: '4px',
    height: '100%',
    transition: 'all 0.2s ease',
  },
  iconContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '24px',
    width: '24px',
  },
  activeDot: {
    position: 'absolute',
    bottom: '-6px',
    width: '4px',
    height: '4px',
    borderRadius: '50%',
    backgroundColor: 'var(--accent-primary)',
    boxShadow: '0 0 8px var(--accent-primary)',
  },
  label: {
    fontSize: '10px',
    transition: 'color 0.2s ease',
  },
  icon: {
    transition: 'transform 0.2s ease, color 0.2s ease',
  }
};
