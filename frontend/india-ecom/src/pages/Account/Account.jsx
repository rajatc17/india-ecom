import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { fetchCurrentUser } from '../../store/auth/authSlice';
import { useEffect } from 'react';
import Loader from '../../components/common/Loader';
import { User, Mail, Phone, MapPin, Calendar, Package, Heart, Settings, LogOut, Award } from 'lucide-react';

const Account = () => {
    const dispatch = useDispatch();
    const { token, isAuthenticated, loading, initialized, currentUser } = useSelector((state) => state.auth);
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-red-50">
            {loading && <Loader />}
            
            {/* Hero Banner with Indian Pattern */}
            <div className="relative bg-gradient-to-r from-orange-600 via-red-600 to-amber-600 h-48 overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute inset-0" style={{
                        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.1) 10px, rgba(255,255,255,.1) 20px)`,
                    }}></div>
                </div>
                <div className="relative max-w-7xl mx-auto px-4 h-full flex items-center">
                    <div className="text-white">
                        <h1 className="text-4xl font-bold mb-2">Namaste, {currentUser?.name}</h1>
                        <p className="text-orange-100">Welcome to your account dashboard</p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 mt-12 pb-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Profile Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-xl border-2 border-orange-200 overflow-hidden">
                            <div className="bg-gradient-to-br from-orange-500 to-red-500 h-24"></div>
                            <div className="px-6 pb-6">
                                <div className="-mt-12 mb-4">
                                    <div className="w-24 h-24 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                                        <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                                            {currentUser?.name?.charAt(0).toUpperCase()}
                                        </div>
                                    </div>
                                </div>
                                
                                <h2 className="text-2xl font-bold text-gray-800 mb-1">{currentUser?.name}</h2>
                                <p className="text-gray-500 mb-4">{currentUser?.email}</p>
                                
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-gray-600">
                                        <Mail size={18} className="text-orange-600" />
                                        <span className="text-sm">{currentUser?.email}</span>
                                    </div>
                                    {currentUser?.phone && (
                                        <div className="flex items-center gap-3 text-gray-600">
                                            <Phone size={18} className="text-orange-600" />
                                            <span className="text-sm">{currentUser.phone}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3 text-gray-600">
                                        <Calendar size={18} className="text-orange-600" />
                                        <span className="text-sm">Joined {new Date(currentUser?.createdAt).toLocaleDateString('en-IN')}</span>
                                    </div>
                                </div>

                                <button className="w-full mt-6 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition flex items-center justify-center gap-2">
                                    <Settings size={18} />
                                    Edit Profile
                                </button>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="mt-6 bg-white rounded-2xl shadow-lg border-2 border-orange-100 p-6">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Award className="text-orange-600" size={20} />
                                Quick Actions
                            </h3>
                            <div className="space-y-2">
                                <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-orange-50 transition flex items-center gap-3 text-gray-700">
                                    <Package size={18} className="text-orange-600" />
                                    My Orders
                                </button>
                                <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-orange-50 transition flex items-center gap-3 text-gray-700">
                                    <Heart size={18} className="text-red-500" />
                                    Wishlist
                                </button>
                                <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-orange-50 transition flex items-center gap-3 text-gray-700">
                                    <MapPin size={18} className="text-orange-600" />
                                    Addresses
                                </button>
                                <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-red-50 transition flex items-center gap-3 text-red-600">
                                    <LogOut size={18} />
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Account Details Card */}
                        <div className="bg-white rounded-2xl shadow-lg border-2 border-orange-100 p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center">
                                    <User className="text-white" size={20} />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800">Account Information</h2>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {Object.entries(currentUser || {}).map(([key, value]) => {
                                    if (key === '__v' || key === 'password') return null;
                                    
                                    return (
                                        <div key={key} className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-200">
                                            <label className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-1 block">
                                                {key.replace(/([A-Z])/g, ' $1').trim()}
                                            </label>
                                            <p className="text-gray-800 font-medium">
                                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Statistics Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 text-white shadow-lg">
                                <Package size={32} className="mb-3 opacity-80" />
                                <p className="text-3xl font-bold mb-1">0</p>
                                <p className="text-orange-100">Total Orders</p>
                            </div>
                            
                            <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-6 text-white shadow-lg">
                                <Heart size={32} className="mb-3 opacity-80" />
                                <p className="text-3xl font-bold mb-1">0</p>
                                <p className="text-amber-100">Wishlist Items</p>
                            </div>
                            
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-white rounded-2xl shadow-lg border-2 border-orange-100 p-6">
                            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Package className="text-orange-600" size={24} />
                                Recent Orders
                            </h2>
                            <div className="text-center py-12">
                                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Package className="text-orange-600" size={32} />
                                </div>
                                <p className="text-gray-500 mb-4">No orders yet</p>
                                <button className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition">
                                    Start Shopping
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Decorative Elements */}
            <div className="fixed bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-orange-200 to-transparent rounded-full blur-3xl opacity-30 pointer-events-none"></div>
            <div className="fixed top-1/2 left-0 w-64 h-64 bg-gradient-to-br from-red-200 to-transparent rounded-full blur-3xl opacity-30 pointer-events-none"></div>
        </div>
    )
}

export default Account