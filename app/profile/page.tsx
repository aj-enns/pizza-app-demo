'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Order } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { User, Package, LogOut, Edit2, Save, X, Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout, updateProfile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    zipCode: '',
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        phone: user.phone,
        address: user.address,
        city: user.city,
        zipCode: user.zipCode,
      });
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`/api/orders/user/${user.id}`);
      const data = await response.json();
      
      if (data.success) {
        setOrders(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');

    const result = await updateProfile({ id: user!.id, ...formData });

    if (result.success) {
      setEditing(false);
    } else {
      setError(result.error || 'Failed to update profile');
    }
    setSaving(false);
  };

  const handleCancel = () => {
    setFormData({
      name: user!.name,
      phone: user!.phone,
      address: user!.address,
      city: user!.city,
      zipCode: user!.zipCode,
    });
    setEditing(false);
    setError('');
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="animate-spin text-primary-600" size={48} />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <User className="text-primary-600 dark:text-primary-500" size={32} />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">My Profile</h1>
          </div>
          <button
            onClick={handleLogout}
            className="btn-secondary flex items-center gap-2"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>

        {/* Profile Information */}
        <div className="card p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Account Information</h2>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="btn-secondary flex items-center gap-2"
              >
                <Edit2 size={18} />
                Edit
              </button>
            )}
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="input-field bg-gray-100 dark:bg-gray-700"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={!editing}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={!editing}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Street Address
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                disabled={!editing}
                className="input-field"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  disabled={!editing}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  ZIP Code
                </label>
                <input
                  type="text"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  disabled={!editing}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {editing && (
            <div className="flex gap-4 mt-6">
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    Save Changes
                  </>
                )}
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="btn-secondary flex-1 flex items-center justify-center gap-2"
              >
                <X size={20} />
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Order History */}
        <div className="card p-8">
          <div className="flex items-center gap-3 mb-6">
            <Package className="text-primary-600 dark:text-primary-500" size={28} />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Order History</h2>
          </div>

          {loadingOrders ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-primary-600" size={32} />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto text-gray-400 dark:text-gray-600 mb-4" size={48} />
              <p className="text-gray-600 dark:text-gray-400 text-lg">No orders yet</p>
              <p className="text-gray-500 dark:text-gray-500 mt-2">Start ordering to see your history here!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-gray-900 dark:text-gray-100">Order #{order.orderNumber}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary-600 dark:text-primary-500">{formatPrice(order.total)}</p>
                      <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 capitalize">
                        {order.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    {order.items.map((item, idx) => (
                      <div key={idx}>
                        {item.quantity}x {item.pizzaName} ({item.size})
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
