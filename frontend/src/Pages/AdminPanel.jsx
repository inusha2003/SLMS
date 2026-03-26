import { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Spinner from '../components/Spinner';
import {
  Search,
  Users,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  Shield,
} from 'lucide-react';

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: 8 };
      if (search) params.search = search;
      if (filter === 'active') params.status = 'active';
      if (filter === 'inactive') params.status = 'inactive';

      const { data } = await api.get('/admin/users', { params });
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, search, filter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    setPagination((p) => ({ ...p, page: 1 }));
  }, [search, filter]);

  const toggleStatus = async (id) => {
    setTogglingId(id);
    try {
      const { data } = await api.put(`/admin/users/${id}/toggle`);
      toast.success(data.message);
      setUsers((prev) =>
        prev.map((u) => (u._id === id ? { ...u, isActive: data.user.isActive } : u))
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setTogglingId(null);
    }
  };

  const filterButton = (f, label, Icon) => (
    <button
      onClick={() => setFilter(f)}
      style={{
        padding: '0.5rem 1rem',
        fontSize: '0.875rem',
        fontWeight: 500,
        borderRadius: '0.75rem',
        transition: 'all 0.3s',
        backgroundColor: filter === f ? '#3b82f6' : 'var(--bg-surface)',
        color: filter === f ? 'white' : 'var(--text-secondary)',
        border: filter === f ? 'none' : '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        if (filter !== f) {
          e.currentTarget.style.backgroundColor = 'rgba(59,130,246,0.1)';
          e.currentTarget.style.color = '#3b82f6';
        }
      }}
      onMouseLeave={(e) => {
        if (filter !== f) {
          e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
          e.currentTarget.style.color = 'var(--text-secondary)';
        }
      }}
    >
      <Icon style={{ width: 16, height: 16 }} /> {label}
    </button>
  );

  return (
    <div style={{ minHeight: 'calc(100vh - 4rem)', position: 'relative', overflow: 'hidden' }}>

      {/* Background Animation */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <div className="animate-pulse-glow" style={{ position: 'absolute', top: '5%', right: '-5%', width: '20rem', height: '20rem', borderRadius: '50%', backgroundColor: 'rgba(59,130,246,0.06)', filter: 'blur(80px)' }} />
        <div className="animate-float-slow" style={{ position: 'absolute', bottom: '10%', left: '-5%', width: '16rem', height: '16rem', borderRadius: '50%', backgroundColor: 'rgba(99,102,241,0.05)', filter: 'blur(64px)' }} />
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '90rem', marginLeft: 'auto', marginRight: 'auto', padding: '2rem 1rem', position: 'relative', zIndex: 10 }}>

        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }} className="sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 800, color: 'var(--text-primary)' }}>
              <div style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '0.75rem',
                background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(59,130,246,0.25)',
              }}>
                <Shield style={{ width: 24, height: 24, color: 'white' }} />
              </div>
              User Management
            </h1>
            <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {pagination.total} total user{pagination.total !== 1 ? 's' : ''} registered
            </p>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} className="sm:flex-row">
            {/* Search */}
            <div style={{ position: 'relative', flex: 1 }}>
              <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '3rem', width: '100%' }}
                className="input-field"
              />
            </div>

            {/* Filter Buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
              {filterButton('all', 'All', Users)}
              {filterButton('active', 'Active', UserCheck)}
              {filterButton('inactive', 'Inactive', UserX)}
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ padding: '5rem 0' }}>
            <Spinner size="lg" />
          </div>
        ) : users.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <Users style={{ width: 48, height: 48, color: 'var(--text-muted)', marginLeft: 'auto', marginRight: 'auto', marginBottom: '1rem' }} />
            <p style={{ color: 'var(--text-secondary)' }}>No users found.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="card overflow-x-auto hidden md:block" style={{ padding: 0 }}>
              <table style={{ width: '100%' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    {['User', 'Email', 'Role', 'Academic Info', 'Status', 'Action'].map((h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: 'left',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                          color: 'var(--text-muted)',
                          padding: '1rem 1.25rem',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr
                      key={u._id}
                      style={{ borderBottom: '1px solid var(--border-color)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(59,130,246,0.03)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      {/* User Column */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '2.25rem',
                            height: '2.25rem',
                            borderRadius: '0.5rem',
                            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.875rem',
                            fontWeight: 700,
                            color: 'white',
                            flexShrink: 0,
                            boxShadow: '0 4px 12px rgba(59,130,246,0.2)',
                          }}>
                            {u.firstName?.[0]}{u.lastName?.[0]}
                          </div>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {u.firstName} {u.lastName}
                          </span>
                        </div>
                      </td>

                      {/* Email */}
                      <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {u.email}
                      </td>

                      {/* Role Badge */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span className={u.role === 'Admin' ? 'badge-violet' : 'badge-primary'}>
                          {u.role}
                        </span>
                      </td>

                      {/* Academic Info */}
                      <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {u.academicYear && u.semester ? `${u.academicYear} - ${u.semester}` : '-'}
                      </td>

                      {/* Status Badge */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span className={u.isActive ? 'badge-green' : 'badge-red'}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: u.isActive ? '#22c55e' : '#ef4444' }} />
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Action Button */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <button
                          onClick={() => toggleStatus(u._id)}
                          disabled={togglingId === u._id}
                          className={u.isActive ? 'btn-danger' : 'btn-success'}
                        >
                          {togglingId === u._id ? <Spinner size="sm" /> : u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {users.map((u) => (
                <div key={u._id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '2.5rem',
                        height: '2.5rem',
                        borderRadius: '0.75rem',
                        background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        color: 'white',
                      }}>
                        {u.firstName?.[0]}{u.lastName?.[0]}
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.firstName} {u.lastName}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{u.email}</p>
                      </div>
                    </div>

                    <span className={u.isActive ? 'badge-green' : 'badge-red'}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: u.isActive ? '#22c55e' : '#ef4444' }} />
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className={u.role === 'Admin' ? 'badge-violet' : 'badge-primary'}>{u.role}</span>
                      {u.academicYear && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.academicYear}</span>}
                    </div>

                    <button
                      onClick={() => toggleStatus(u._id)}
                      disabled={togglingId === u._id}
                      className={u.isActive ? 'btn-danger' : 'btn-success'}
                    >
                      {togglingId === u._id ? <Spinner size="sm" /> : u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '1.5rem',
              }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  Page {pagination.page} of {pagination.pages}
                </p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                    disabled={pagination.page <= 1}
                    className="btn-secondary"
                    style={{ padding: '0.5rem 0.75rem' }}
                  >
                    <ChevronLeft style={{ width: 16, height: 16 }} />
                  </button>
                  <button
                    onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                    disabled={pagination.page >= pagination.pages}
                    className="btn-secondary"
                    style={{ padding: '0.5rem 0.75rem' }}
                  >
                    <ChevronRight style={{ width: 16, height: 16 }} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;