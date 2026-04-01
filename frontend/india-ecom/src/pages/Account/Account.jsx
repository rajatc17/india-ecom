import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import { logout, updateUserProfile } from '../../store/auth/authSlice';
import {
    formatAddressCityStatePincode,
    initialAddressForm,
} from '../../api/util';
import { User, Mail, Phone, MapPin, Package, Heart, LogOut, Award } from 'lucide-react';
import AddressFormModal from '../../components/modal/AddressFormModal';

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
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [addressMode, setAddressMode] = useState('add');
    const [editingAddressId, setEditingAddressId] = useState(null);
    const [addressModalInitialValues, setAddressModalInitialValues] = useState(initialAddressForm);
    const [addressSubmitError, setAddressSubmitError] = useState('');
    const [isSavingAddress, setIsSavingAddress] = useState(false);

    const fallbackInitial = currentUser?.name?.trim()?.charAt(0)?.toUpperCase() || 'U';
    const savedAddresses = Array.isArray(currentUser?.addresses) ? currentUser.addresses : [];

    const openAddressModal = () => {
        setAddressMode('add');
        setEditingAddressId(null);
        setAddressModalInitialValues({
            ...initialAddressForm,
            fullName: currentUser?.name || '',
            phone: currentUser?.phone || '',
            isDefault: savedAddresses.length === 0,
        });
        setAddressSubmitError('');
        setIsAddressModalOpen(true);
    };

    const openEditAddressModal = (address) => {
        setAddressMode('edit');
        setEditingAddressId(address?._id || null);
        setAddressModalInitialValues({
            ...initialAddressForm,
            ...address,
            fullName: address?.fullName || currentUser?.name || '',
            phone: address?.phone || currentUser?.phone || '',
            isDefault: Boolean(address?.isDefault),
            country: 'India',
        });
        setAddressSubmitError('');
        setIsAddressModalOpen(true);
    };

    const closeAddressModal = () => {
        if (isSavingAddress) return;
        setIsAddressModalOpen(false);
    };

    const ensureSingleDefault = (addresses) => {
        if (!Array.isArray(addresses) || addresses.length === 0) {
            return [];
        }

        const hasDefault = addresses.some((address) => address?.isDefault);
        if (hasDefault) {
            return addresses;
        }

        return addresses.map((address, index) => ({
            ...address,
            isDefault: index === 0,
        }));
    };

    const handleSaveAddress = async (nextAddress) => {
        if (!nextAddress) return;

        try {
            setIsSavingAddress(true);
            setAddressSubmitError('');

            const currentAddresses = savedAddresses.map((address) => ({
                ...address,
                _id: address?._id,
            }));

            let updatedAddresses;

            if (addressMode === 'edit' && editingAddressId) {
                updatedAddresses = currentAddresses.map((address) => {
                    if (address?._id !== editingAddressId) {
                        return nextAddress.isDefault ? { ...address, isDefault: false } : address;
                    }

                    return {
                        ...address,
                        ...nextAddress,
                        _id: address?._id,
                    };
                });
            } else {
                updatedAddresses = nextAddress.isDefault
                    ? [
                        ...currentAddresses.map((address) => ({ ...address, isDefault: false })),
                        nextAddress,
                    ]
                    : [...currentAddresses, nextAddress];
            }

            updatedAddresses = ensureSingleDefault(updatedAddresses);

            await dispatch(updateUserProfile({ addresses: updatedAddresses })).unwrap();
            setIsAddressModalOpen(false);
        } catch (error) {
            setAddressSubmitError(error || 'Failed to save address. Please try again.');
        } finally {
            setIsSavingAddress(false);
        }
    };

    const panelContent = (() => {
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
                                            Saved Addresses
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={openAddressModal}
                                        className="px-4 py-2 rounded-lg border border-orange-200 text-orange-700 text-sm font-semibold hover:bg-orange-50 transition"
                                    >
                                        Add Address
                                    </button>
                                </div>

                                {savedAddresses.length > 0 ? (
                                    <div className="space-y-3">
                                        {savedAddresses.map((address, index) => (
                                            <div
                                                key={address?._id || `${address?.line1 || 'address'}-${index}`}
                                                className="rounded-xl border border-orange-100 bg-orange-50 p-4"
                                            >
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {address?.fullName || currentUser?.name}
                                                    {address?.isDefault ? (
                                                        <span className="ml-2 text-xs font-semibold text-orange-700">Default</span>
                                                    ) : null}
                                                </p>
                                                <p className="mt-1 text-sm text-gray-700">{address?.line1}</p>
                                                {address?.line2 ? (
                                                    <p className="text-sm text-gray-700">{address.line2}</p>
                                                ) : null}
                                                <p className="text-sm text-gray-700">
                                                    {formatAddressCityStatePincode(address)}
                                                </p>
                                                <p className="mt-1 text-sm text-gray-700">
                                                    Phone: {address?.phone || currentUser?.phone || '-'}
                                                </p>

                                                <div className="mt-3 border-t border-orange-100 pt-3 flex justify-end">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditAddressModal(address)}
                                                        className="px-3 py-2 rounded-lg border border-orange-200 text-orange-700 text-xs font-semibold hover:bg-orange-100 transition"
                                                    >
                                                        Edit Address
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="rounded-xl border border-orange-100 bg-orange-50 p-4">
                                        <p className="text-sm font-medium text-gray-800">No saved address.</p>
                                        <p className="mt-1 text-sm text-gray-600">Add an address for faster checkout.</p>
                                    </div>
                                )}
                            </div>
                        </>
                    ),
                };
        }
    })();

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
                                {QUICK_ACTIONS.map(({ key, label, icon }) => {
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
                                            {React.createElement(icon, {
                                                size: 17,
                                                className: isActive ? 'text-orange-700' : 'text-orange-600',
                                            })}
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

            <AddressFormModal
                isOpen={isAddressModalOpen}
                mode={addressMode}
                initialValues={addressModalInitialValues}
                isSaving={isSavingAddress}
                submitError={addressSubmitError}
                onClose={closeAddressModal}
                onSubmit={handleSaveAddress}
            />
        </div>
    );
};

export default Account