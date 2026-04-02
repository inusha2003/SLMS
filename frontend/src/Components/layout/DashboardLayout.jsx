import AdminSidebar from './AdminSidebar';
import StudentSidebar from './StudentSidebar';
import useAuth from '../../hooks/useAuth';

const DashboardLayout = ({ children }) => {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen bg-lms-darkest">
      {user?.role === 'Admin' ? <AdminSidebar /> : <StudentSidebar />}
      <main className="flex-1 min-w-0 overflow-auto">
        <div className="p-6 lg:p-8 pt-16 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;