import React, { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import { logout, updateUserProfile } from '../../store/auth/authSlice';
import {
    ADDRESS_STATES,
    formatAddressCityStatePincode,
    initialAddressForm,
    sanitizeAddressPayload,
    validateAddress,
} from '../../api/util';
import { User, Mail, Phone, MapPin, Package, Heart, LogOut, Award, X } from 'lucide-react';

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
    const [addressForm, setAddressForm] = useState(initialAddressForm);
    const [addressErrors, setAddressErrors] = useState({});
    const [addressSubmitError, setAddressSubmitError] = useState('');
    const [isSavingAddress, setIsSavingAddress] = useState(false);

    const fallbackInitial = currentUser?.name?.trim()?.charAt(0)?.toUpperCase() || 'U';
    const savedAddresses = Array.isArray(currentUser?.addresses) ? currentUser.addresses : [];
    const defaultAddress = savedAddresses.find((address) => address?.isDefault) || savedAddresses[0] || null;

    const handleAddressFormChange = (event) => {
        const { name, value, type, checked } = event.target;
        setAddressForm((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));

        setAddressErrors((prev) => ({
            ...prev,
            [name]: '',
        }));
        setAddressSubmitError('');
    };

    const openAddressModal = () => {
        setAddressForm({
            ...initialAddressForm,
            fullName: currentUser?.name || '',
            phone: currentUser?.phone || '',
            isDefault: savedAddresses.length === 0,
        });
        setAddressErrors({});
        setAddressSubmitError('');
        setIsAddressModalOpen(true);
    };

    const closeAddressModal = () => {
        if (isSavingAddress) return;
        setIsAddressModalOpen(false);
    };

    const handleAddAddress = async (event) => {
        event.preventDefault();

        const validationErrors = validateAddress(addressForm);
        setAddressErrors(validationErrors);
        if (Object.keys(validationErrors).length > 0) {
            return;
        }

        try {
            setIsSavingAddress(true);
            setAddressSubmitError('');

            const nextAddress = sanitizeAddressPayload(addressForm);
            const currentAddresses = savedAddresses.map((address) => ({
                ...address,
                _id: address?._id,
            }));

            const updatedAddresses = nextAddress.isDefault
                ? [
                    ...currentAddresses.map((address) => ({ ...address, isDefault: false })),
                    nextAddress,
                ]
                : [...currentAddresses, nextAddress];

            await dispatch(updateUserProfile({ addresses: updatedAddresses })).unwrap();
            setIsAddressModalOpen(false);
        } catch (error) {
            setAddressSubmitError(error || 'Failed to save address. Please try again.');
        } finally {
            setIsSavingAddress(false);
        }
    };

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
                                        onClick={openAddressModal}
                                        className="px-4 py-2 rounded-lg border border-orange-200 text-orange-700 text-sm font-semibold hover:bg-orange-50 transition"
                                    >
                                        Add Address
                                    </button>
                                </div>

                                <div className="rounded-xl border border-orange-100 bg-orange-50 p-4">
                                    {defaultAddress ? (
                                        <>
                                            <p className="text-sm font-semibold text-gray-900">
                                                {defaultAddress?.fullName || currentUser?.name}
                                                {defaultAddress?.isDefault ? (
                                                    <span className="ml-2 text-xs font-semibold text-orange-700">Default</span>
                                                ) : null}
                                            </p>
                                            <p className="mt-1 text-sm text-gray-700">{defaultAddress?.line1}</p>
                                            {defaultAddress?.line2 ? (
                                                <p className="text-sm text-gray-700">{defaultAddress.line2}</p>
                                            ) : null}
                                            <p className="text-sm text-gray-700">
                                                {formatAddressCityStatePincode(defaultAddress)}
                                            </p>
                                            <p className="mt-1 text-sm text-gray-700">
                                                Phone: {defaultAddress?.phone || currentUser?.phone || '-'}
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-sm font-medium text-gray-800">No saved address.</p>
                                            <p className="mt-1 text-sm text-gray-600">Add an address for faster checkout.</p>
                                        </>
                                    )}
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

            {isAddressModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <button
                        type="button"
                        className="absolute inset-0 bg-black/40"
                        aria-label="Close add address modal"
                        onClick={closeAddressModal}
                    />

                    <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-amber-300 bg-white shadow-2xl">
                        <div className="shilpika-bg px-5 py-4 border-b border-amber-200 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Add New Address</h3>
                                <p className="text-xs text-gray-700 mt-1">Enter delivery details exactly as per your location.</p>
                            </div>
                            <button
                                type="button"
                                onClick={closeAddressModal}
                                className="p-2 rounded-full hover:bg-white/70 transition"
                                aria-label="Close modal"
                            >
                                <X size={18} className="text-gray-700" />
                            </button>
                        </div>

                        <form onSubmit={handleAddAddress} className="p-5 sm:p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-semibold text-gray-800">Label</label>
                                    <select
                                        name="label"
                                        value={addressForm.label}
                                        onChange={handleAddressFormChange}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                                    >
                                        <option value="Home">Home</option>
                                        <option value="Work">Work</option>
                                        <option value="Other">Other</option>
                                    </select>
                                    {addressErrors.label ? <p className="mt-1 text-xs text-red-600">{addressErrors.label}</p> : null}
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-gray-800">Address Type</label>
                                    <select
                                        name="type"
                                        value={addressForm.type}
                                        onChange={handleAddressFormChange}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                                    >
                                        <option value="both">Billing + Shipping</option>
                                        <option value="billing">Billing only</option>
                                        <option value="shipping">Shipping only</option>
                                    </select>
                                    {addressErrors.type ? <p className="mt-1 text-xs text-red-600">{addressErrors.type}</p> : null}
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-gray-800">Full Name</label>
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={addressForm.fullName}
                                        onChange={handleAddressFormChange}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                                    />
                                    {addressErrors.fullName ? <p className="mt-1 text-xs text-red-600">{addressErrors.fullName}</p> : null}
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-gray-800">Phone</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={addressForm.phone}
                                        onChange={handleAddressFormChange}
                                        maxLength={10}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                                    />
                                    {addressErrors.phone ? <p className="mt-1 text-xs text-red-600">{addressErrors.phone}</p> : null}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="text-sm font-semibold text-gray-800">Address Line 1</label>
                                    <input
                                        type="text"
                                        name="line1"
                                        value={addressForm.line1}
                                        onChange={handleAddressFormChange}
                                        maxLength={200}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                                    />
                                    {addressErrors.line1 ? <p className="mt-1 text-xs text-red-600">{addressErrors.line1}</p> : null}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="text-sm font-semibold text-gray-800">Address Line 2 (Optional)</label>
                                    <input
                                        type="text"
                                        name="line2"
                                        value={addressForm.line2}
                                        onChange={handleAddressFormChange}
                                        maxLength={200}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                                    />
                                    {addressErrors.line2 ? <p className="mt-1 text-xs text-red-600">{addressErrors.line2}</p> : null}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="text-sm font-semibold text-gray-800">Landmark (Optional)</label>
                                    <input
                                        type="text"
                                        name="landmark"
                                        value={addressForm.landmark}
                                        onChange={handleAddressFormChange}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-gray-800">City</label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={addressForm.city}
                                        onChange={handleAddressFormChange}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                                    />
                                    {addressErrors.city ? <p className="mt-1 text-xs text-red-600">{addressErrors.city}</p> : null}
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-gray-800">Pincode</label>
                                    <input
                                        type="text"
                                        name="pincode"
                                        value={addressForm.pincode}
                                        onChange={handleAddressFormChange}
                                        maxLength={6}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                                    />
                                    {addressErrors.pincode ? <p className="mt-1 text-xs text-red-600">{addressErrors.pincode}</p> : null}
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-gray-800">State / UT</label>
                                    <select
                                        name="state"
                                        value={addressForm.state}
                                        onChange={handleAddressFormChange}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                                    >
                                        <option value="">Select state</option>
                                        {ADDRESS_STATES.map((stateName) => (
                                            <option key={stateName} value={stateName}>{stateName}</option>
                                        ))}
                                    </select>
                                    {addressErrors.state ? <p className="mt-1 text-xs text-red-600">{addressErrors.state}</p> : null}
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-gray-800">Country</label>
                                    <input
                                        type="text"
                                        name="country"
                                        value="India"
                                        disabled
                                        className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-600"
                                    />
                                </div>
                            </div>

                            <label className="mt-4 flex items-center gap-2 text-sm text-gray-700">
                                <input
                                    type="checkbox"
                                    name="isDefault"
                                    checked={addressForm.isDefault}
                                    onChange={handleAddressFormChange}
                                    className="accent-amber-600"
                                />
                                Set as default address
                            </label>

                            {addressSubmitError ? (
                                <p className="mt-3 text-sm text-red-600">{addressSubmitError}</p>
                            ) : null}

                            <div className="mt-6 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={closeAddressModal}
                                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSavingAddress}
                                    className="px-5 py-2 rounded-lg bg-gradient-to-r from-orange-600 to-amber-500 text-white text-sm font-semibold hover:shadow-md disabled:opacity-70 transition"
                                >
                                    {isSavingAddress ? 'Saving...' : 'Save Address'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Account