import { Outlet } from 'react-router-dom';
import PublicHeader from './components/PublicHeader';
import PublicFooter from './components/PublicFooter';
import { PageTransition } from './components/PageTransition';

/** Shell for every public page: header, content, footer. */
export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-app-bg">
      <PublicHeader />
      <main className="flex-1">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
      <PublicFooter />
    </div>
  );
}

export default PublicLayout;
