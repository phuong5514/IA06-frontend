import React, { useState, useEffect } from 'react'
import axios from 'axios'
import './StaffManagement.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

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

  useEffect(() => {
    fetchStaff()
  }, [includeInactive])

  const fetchStaff = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.get(
        `${API_BASE_URL}/api/users/staff?include_inactive=${includeInactive}`,
        { withCredentials: true }
      )
      setStaff(response.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load staff')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError(null)
      await axios.post(`${API_BASE_URL}/api/users/staff`, createForm, {
        withCredentials: true,
      })
      setShowCreateForm(false)
      setCreateForm({ email: '', password: '', name: '', phone: '', role: 'waiter' })
      fetchStaff()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create staff')
    }
  }

  const handleDeactivate = async (userId: string) => {
    if (!confirm('Are you sure you want to deactivate this staff member?')) {
      return
    }
    try {
      setError(null)
      await axios.patch(
        `${API_BASE_URL}/api/users/staff/${userId}/deactivate`,
        {},
        { withCredentials: true }
      )
      fetchStaff()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to deactivate staff')
    }
  }

  const handleActivate = async (userId: string) => {
    try {
      setError(null)
      await axios.patch(
        `${API_BASE_URL}/api/users/staff/${userId}/activate`,
        {},
        { withCredentials: true }
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

  if (loading) {
    return (
      <div className="staff-management">
        <div className="loading">Loading staff...</div>
      </div>
    )
  }

  return (
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
          <button className="btn-primary" onClick={() => setShowCreateForm(true)}>
            + Add Staff
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
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
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
            {staff.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center">
                  No staff members found
                </td>
              </tr>
            ) : (
              staff.map((member) => (
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
                        className="btn-danger btn-small"
                        onClick={() => handleDeactivate(member.id)}
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        className="btn-success btn-small"
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
    </div>
  )
}
