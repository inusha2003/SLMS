import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import StudentSidebar from './StudentSidebar';
import useAuth from '../../hooks/useAuth';

const DashboardLayout = ({ children }) => {
  const { user } = useAuth();

  return (
    <div className="flex h-full min-h-0 overflow-hidden bg-lms-darkest">
      {user?.role === 'Admin' ? <AdminSidebar /> : <StudentSidebar />}
      <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
        <div className="min-h-full p-6 pt-16 lg:p-8 lg:pt-8">
          {children ?? <Outlet />}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
