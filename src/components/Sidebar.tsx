import Link from 'next/link';

export default function Sidebar() {
  return (
    <aside style={{
      width: '240px',
      backgroundColor: 'var(--bg-dark)',
      borderRight: '1px solid var(--border-color)',
      padding: '24px 16px',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0
    }}>
      <div style={{ marginBottom: '40px', padding: '0 8px' }}>
        <h2 style={{ fontSize: '18px', color: 'var(--spotify-green)', marginBottom: '4px' }}>Discovery Engine</h2>
        <p style={{ fontSize: '12px', color: 'var(--text-subdued)' }}>PM Analysis Tool</p>
      </div>
      
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        <SidebarLink href="/" label="Dashboard" />
        <SidebarLink href="/ingest" label="Data Ingestion" />
        <SidebarLink href="/analysis" label="Analysis Results" />
        <SidebarLink href="/reviews" label="Review Explorer" />
      </nav>

      <nav style={{ marginTop: 'auto' }}>
        <SidebarLink href="/settings" label="Settings" />
      </nav>
    </aside>
  );
}

function SidebarLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} style={{
      display: 'block',
      padding: '12px 16px',
      borderRadius: 'var(--radius-sm)',
      color: 'var(--text-base)',
      textDecoration: 'none',
      fontWeight: 600,
      fontSize: '14px',
      transition: 'all var(--transition-fast)'
    }}
    className="sidebar-link"
    >
      {label}
      <style>{`
        .sidebar-link:hover {
          background-color: var(--bg-elevated);
          color: var(--text-highlight);
        }
      `}</style>
    </Link>
  );
}
