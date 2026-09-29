import { Outlet } from 'react-router-dom';
import PublicHeader from './components/PublicHeader';
import PublicFooter from './components/PublicFooter';

/** Shell for every public page: header, content, footer. */
export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-app-bg">
      <PublicHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}

export default PublicLayout;
