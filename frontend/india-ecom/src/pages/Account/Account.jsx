import React, { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import { logout } from '../../store/auth/authSlice';
import { User, Mail, Phone, MapPin, Package, Heart, LogOut, Award } from 'lucide-react';

const QUICK_ACTIONS = [
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'orders', label: 'Orders', icon: Package },
    { key: 'wishlist', label: 'Wishlist', icon: Heart },
];

const AccountShimmer = () => (
    <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-orange-100 bg-white p-5 space-y-4">
                <div className="account-shimmer h-16 w-16 rounded-full" />
                <div className="account-shimmer h-5 w-2/3 rounded-md" />
                <div className="account-shimmer h-4 w-4/5 rounded-md" />
                <div className="account-shimmer h-10 w-full rounded-xl" />
            </div>
            <div className="lg:col-span-2 rounded-2xl border border-orange-100 bg-white p-5 space-y-4">
                <div className="account-shimmer h-6 w-1/3 rounded-md" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="account-shimmer h-24 rounded-xl" />
                    <div className="account-shimmer h-24 rounded-xl" />
                    <div className="account-shimmer h-24 rounded-xl" />
                    <div className="account-shimmer h-24 rounded-xl" />
                </div>
            </div>
        </div>
    </div>
);

const Account = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, currentUser } = useSelector((state) => state.auth);
    const [activePanel, setActivePanel] = useState('profile');

    const fallbackInitial = currentUser?.name?.trim()?.charAt(0)?.toUpperCase() || 'U';

    const panelContent = useMemo(() => {
        switch (activePanel) {
            case 'orders':
                return {
                    title: 'My Orders',
                    content: (
                        <div className="rounded-xl border border-orange-100 bg-orange-50 p-5">
                            <p className="text-sm font-medium text-gray-800">No orders yet.</p>
                            <p className="mt-1 text-sm text-gray-600">Your placed orders will appear here.</p>
                        </div>
                    ),
                };
            case 'wishlist':
                return {
                    title: 'Wishlist',
                    content: (
                        <div className="rounded-xl border border-orange-100 bg-orange-50 p-5">
                            <p className="text-sm font-medium text-gray-800">Wishlist is empty.</p>
                            <p className="mt-1 text-sm text-gray-600">Save products to access them quickly later.</p>
                        </div>
                    ),
                };
            case 'profile':
            default:
                return {
                    title: 'Account Information',
                    content: (
                        <>
                            <div className="flex items-center justify-end mb-4">
                                <button
                                    type="button"
                                    className="px-4 py-2 rounded-lg border border-orange-200 text-orange-700 text-sm font-semibold hover:bg-orange-50 transition"
                                >
                                    Edit Info
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="rounded-xl border border-orange-100 bg-orange-50 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">Name</p>
                                    <p className="mt-1 text-gray-900 font-medium">{currentUser?.name || '-'}</p>
                                </div>
                                <div className="rounded-xl border border-orange-100 bg-orange-50 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">Email</p>
                                    <p className="mt-1 text-gray-900 font-medium">{currentUser?.email || '-'}</p>
                                </div>
                                <div className="rounded-xl border border-orange-100 bg-orange-50 p-4 md:col-span-2">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">Phone</p>
                                    <p className="mt-1 text-gray-900 font-medium">{currentUser?.phone || '-'}</p>
                                </div>
                            </div>

                            <div className="mt-6 border-t border-orange-100 pt-6">
                                <div className="flex items-center justify-between gap-3 mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                        <MapPin size={18} className="text-orange-600" />
                                        Saved Address
                                    </h3>
                                    <button
                                        type="button"
                                        className="px-4 py-2 rounded-lg border border-orange-200 text-orange-700 text-sm font-semibold hover:bg-orange-50 transition"
                                    >
                                        Edit Address
                                    </button>
                                </div>

                                <div className="rounded-xl border border-orange-100 bg-orange-50 p-4">
                                    <p className="text-sm font-medium text-gray-800">No saved address.</p>
                                    <p className="mt-1 text-sm text-gray-600">Add an address during checkout and it will show here.</p>
                                </div>
                            </div>
                        </>
                    ),
                };
        }
    }, [activePanel, currentUser]);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/');
    };

    if (loading || !currentUser) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-red-50 py-8">
                <AccountShimmer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-red-50 py-8">
            <div className="max-w-6xl mx-auto px-4">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">My Account</h1>
                <p className="mt-1 text-sm text-gray-600">Manage profile and account actions</p>

                <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-6">
                            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-white flex items-center justify-center text-2xl font-bold">
                                {fallbackInitial}
                            </div>
                            <h2 className="mt-4 text-xl font-semibold text-gray-900">{currentUser?.name}</h2>
                            <div className="mt-3 space-y-2 text-sm text-gray-700">
                                <div className="flex items-center gap-2">
                                    <Mail size={16} className="text-orange-600" />
                                    <span>{currentUser?.email || '-'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone size={16} className="text-orange-600" />
                                    <span>{currentUser?.phone || '-'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="hidden lg:block bg-white rounded-2xl border border-orange-100 shadow-sm p-5">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <Award size={18} className="text-orange-600" />
                                Quick Actions
                            </h3>
                            <div className="mt-3 space-y-2">
                                {QUICK_ACTIONS.map(({ key, label, icon: Icon }) => {
                                    const isActive = activePanel === key;

                                    return (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setActivePanel(key)}
                                            className={`w-full flex items-center gap-3 text-left px-4 py-3 rounded-lg border transition ${
                                                isActive
                                                    ? 'bg-orange-50 text-orange-700 border-orange-200'
                                                    : 'bg-white text-gray-700 border-transparent hover:bg-orange-50'
                                            }`}
                                        >
                                            <Icon size={17} className={isActive ? 'text-orange-700' : 'text-orange-600'} />
                                            <span className="text-sm font-medium">{label}</span>
                                        </button>
                                    );
                                })}

                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 text-left px-4 py-3 rounded-lg border border-transparent hover:bg-red-50 text-red-600 transition"
                                >
                                    <LogOut size={17} />
                                    <span className="text-sm font-medium">Logout</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        <div className="lg:hidden bg-white rounded-2xl border border-orange-100 shadow-sm p-3 mb-4">
                            <div className="flex items-center gap-2 mb-3 px-1">
                                <Award size={16} className="text-orange-600" />
                                <p className="text-sm font-semibold text-gray-900">Quick Actions</p>
                            </div>

                            <div className="rounded-xl border border-orange-100 bg-orange-50/60 p-1 flex gap-1 overflow-x-auto">
                                {QUICK_ACTIONS.map(({ key, label }) => {
                                    const isActive = activePanel === key;

                                    return (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setActivePanel(key)}
                                            className={`flex-1 min-w-[110px] px-3 py-2 rounded-lg text-xs font-semibold border transition ${
                                                isActive
                                                    ? 'bg-white text-orange-700 border-orange-300 shadow-sm'
                                                    : 'bg-transparent text-gray-700 border-transparent'
                                            }`}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                type="button"
                                onClick={handleLogout}
                                className="w-full mt-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition"
                            >
                                Logout
                            </button>
                        </div>

                        <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-5">{panelContent.title}</h2>
                        {panelContent.content}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Account