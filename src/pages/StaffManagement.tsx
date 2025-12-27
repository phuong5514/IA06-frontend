import React, { useState, useEffect } from 'react'
import { apiClient } from '../config/api'
import { useAuth } from '../context/AuthContext'
import { Plus } from 'lucide-react'
import './StaffManagement.css'
import DashboardLayout from '../components/DashboardLayout'

interface Staff {
  id: string
  email: string
  name: string
  phone?: string
  role: 'admin' | 'waiter' | 'kitchen'
  is_active: boolean
  email_verified: boolean
  created_at: string
  last_login?: string
}

interface CreateStaffForm {
  email: string
  password: string
  name: string
  phone?: string
  role: 'admin' | 'waiter' | 'kitchen'
}

export default function StaffManagement() {
  const { user } = useAuth()
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [includeInactive, setIncludeInactive] = useState(false)
  const [createForm, setCreateForm] = useState<CreateStaffForm>({
    email: '',
    password: '',
    name: '',
    phone: '',
    role: 'waiter',
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    fetchStaff()
  }, [includeInactive])

  const fetchStaff = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.get(
        `/users/staff?include_inactive=${includeInactive}`
      )
      if (Array.isArray(response.data)) {
        setStaff(response.data)
      } else {
        setError('Invalid data format received from server')
        setStaff([])
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load staff')
      setStaff([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError(null)
      await apiClient.post(`/users/staff`, createForm)
      setShowCreateForm(false)
      setCreateForm({ email: '', password: '', name: '', phone: '', role: 'waiter' })
      fetchStaff()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create staff')
    }
  }

  const handleDeactivate = async (userId: string) => {
    // if (!confirm('Are you sure you want to deactivate this staff member?')) {
    //   return
    // }
    try {
      setError(null)
      await apiClient.patch(
        `/users/staff/${userId}/deactivate`
      )
      fetchStaff()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to deactivate staff')
    }
  }

  const handleActivate = async (userId: string) => {
    try {
      setError(null)
      await apiClient.patch(
        `/users/staff/${userId}/activate`
      )
      fetchStaff()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to activate staff')
    }
  }

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'admin':
        return 'badge-admin'
      case 'waiter':
        return 'badge-waiter'
      case 'kitchen':
        return 'badge-kitchen'
      default:
        return 'badge-default'
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setCurrentPage(1) // Reset to first page when page size changes
  }

  // Calculate pagination
  const totalStaff = staff.length
  const totalPages = Math.ceil(totalStaff / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedStaff = staff.slice(startIndex, endIndex)

  if (loading) {
    return (
      <DashboardLayout>
        <div className="staff-management">
          <div className="loading">Loading staff...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="staff-management">
      <div className="staff-header">
        <h1>Staff Management</h1>
        <div className="staff-actions">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
            />
            Show inactive
          </label>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2" onClick={() => setShowCreateForm(true)}>
            <Plus size={16} />
            Add Staff
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError(null)}>&times;</button>
        </div>
      )}

      {showCreateForm && (
        <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Staff Member</h2>
            <form onSubmit={handleCreateStaff}>
              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  id="email"
                  type="email"
                  required
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password *</label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                />
                <small>At least 8 characters, one uppercase, one lowercase, one number</small>
              </div>

              <div className="form-group">
                <label htmlFor="name">Name *</label>
                <input
                  id="name"
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone</label>
                <input
                  id="phone"
                  type="tel"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="role">Role *</label>
                <select
                  id="role"
                  required
                  value={createForm.role}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      role: e.target.value as 'admin' | 'waiter' | 'kitchen',
                    })
                  }
                >
                  <option value="waiter">Waiter</option>
                  <option value="kitchen">Kitchen</option>
                  {user?.role === 'super_admin' && (
                    <option value="admin">Admin</option>
                  )}
                </select>
              </div>

              <div className="form-actions">
                <button type="button" className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                  Create Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="staff-table-container">
        <table className="staff-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {totalStaff === 0 ? (
              <tr>
                <td colSpan={7} className="text-center">
                  No staff members found
                </td>
              </tr>
            ) : (
              paginatedStaff.map((member) => (
                <tr key={member.id} className={!member.is_active ? 'row-inactive' : ''}>
                  <td>{member.name}</td>
                  <td>{member.email}</td>
                  <td>{member.phone || '-'}</td>
                  <td>
                    <span className={`badge ${getRoleBadgeClass(member.role)}`}>
                      {member.role}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${member.is_active ? 'badge-active' : 'badge-inactive'}`}>
                      {member.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{new Date(member.created_at).toLocaleDateString()}</td>
                  <td>
                    {member.is_active ? (
                      <button
                        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                        onClick={() => handleDeactivate(member.id)}
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                        onClick={() => handleActivate(member.id)}
                      >
                        Activate
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalStaff > 0 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 border-t border-gray-200 sm:px-6 mt-4">
          <div className="flex items-center">
            <div className="text-sm text-gray-700">
              Showing {startIndex + 1} to {Math.min(endIndex, totalStaff)} of {totalStaff} staff members
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div>
              <label className="text-sm text-gray-700 mr-2">Items per page:</label>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Previous</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => {
                  if (totalPages <= 7) return true;
                  if (page === 1 || page === totalPages) return true;
                  if (Math.abs(page - currentPage) <= 1) return true;
                  return false;
                })
                .map((page, index, array) => (
                  <React.Fragment key={page}>
                    {index > 0 && array[index - 1] !== page - 1 && (
                      <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                        ...
                      </span>
                    )}
                    <button
                      onClick={() => handlePageChange(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Next</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      )}

      </div>
    </DashboardLayout>
  )
}
