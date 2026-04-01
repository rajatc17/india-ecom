import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import {
    ADDRESS_STATES,
    initialAddressForm,
    sanitizeAddressPayload,
    validateAddress,
} from '../../api/util';

const AddressFormModal = ({
    isOpen,
    mode = 'add',
    initialValues,
    isSaving = false,
    submitError = '',
    onClose,
    onSubmit,
}) => {
    const [formValues, setFormValues] = useState(initialAddressForm);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (!isOpen) return;

        setFormValues({
            ...initialAddressForm,
            ...initialValues,
            country: 'India',
        });
        setErrors({});
    }, [isOpen, initialValues]);

    if (!isOpen) {
        return null;
    }

    const handleClose = () => {
        if (isSaving) return;
        onClose();
    };

    const handleChange = (event) => {
        const { name, value, type, checked } = event.target;

        setFormValues((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));

        setErrors((prev) => ({
            ...prev,
            [name]: '',
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const validationErrors = validateAddress(formValues);
        setErrors(validationErrors);

        if (Object.keys(validationErrors).length > 0) {
            return;
        }

        await onSubmit(sanitizeAddressPayload(formValues));
    };

    const title = mode === 'edit' ? 'Edit Address' : 'Add New Address';
    const submitLabel = mode === 'edit' ? 'Save Changes' : 'Save Address';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button
                type="button"
                className="absolute inset-0 bg-black/40"
                aria-label="Close address modal"
                onClick={handleClose}
            />

            <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-amber-300 bg-white shadow-2xl">
                <div className="shilpika-bg px-5 py-4 border-b border-amber-200 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                        <p className="text-xs text-gray-700 mt-1">Enter delivery details exactly as per your location.</p>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="p-2 rounded-full hover:bg-white/70 transition"
                        aria-label="Close modal"
                    >
                        <X size={18} className="text-gray-700" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 sm:p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-semibold text-gray-800">Label</label>
                            <select
                                name="label"
                                value={formValues.label}
                                onChange={handleChange}
                                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                            >
                                <option value="Home">Home</option>
                                <option value="Work">Work</option>
                                <option value="Other">Other</option>
                            </select>
                            {errors.label ? <p className="mt-1 text-xs text-red-600">{errors.label}</p> : null}
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-gray-800">Address Type</label>
                            <select
                                name="type"
                                value={formValues.type}
                                onChange={handleChange}
                                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                            >
                                <option value="both">Billing + Shipping</option>
                                <option value="billing">Billing only</option>
                                <option value="shipping">Shipping only</option>
                            </select>
                            {errors.type ? <p className="mt-1 text-xs text-red-600">{errors.type}</p> : null}
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-gray-800">Full Name</label>
                            <input
                                type="text"
                                name="fullName"
                                value={formValues.fullName}
                                onChange={handleChange}
                                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                            />
                            {errors.fullName ? <p className="mt-1 text-xs text-red-600">{errors.fullName}</p> : null}
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-gray-800">Phone</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formValues.phone}
                                onChange={handleChange}
                                maxLength={10}
                                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                            />
                            {errors.phone ? <p className="mt-1 text-xs text-red-600">{errors.phone}</p> : null}
                        </div>

                        <div className="md:col-span-2">
                            <label className="text-sm font-semibold text-gray-800">Address Line 1</label>
                            <input
                                type="text"
                                name="line1"
                                value={formValues.line1}
                                onChange={handleChange}
                                maxLength={200}
                                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                            />
                            {errors.line1 ? <p className="mt-1 text-xs text-red-600">{errors.line1}</p> : null}
                        </div>

                        <div className="md:col-span-2">
                            <label className="text-sm font-semibold text-gray-800">Address Line 2 (Optional)</label>
                            <input
                                type="text"
                                name="line2"
                                value={formValues.line2}
                                onChange={handleChange}
                                maxLength={200}
                                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                            />
                            {errors.line2 ? <p className="mt-1 text-xs text-red-600">{errors.line2}</p> : null}
                        </div>

                        <div className="md:col-span-2">
                            <label className="text-sm font-semibold text-gray-800">Landmark (Optional)</label>
                            <input
                                type="text"
                                name="landmark"
                                value={formValues.landmark}
                                onChange={handleChange}
                                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-gray-800">City</label>
                            <input
                                type="text"
                                name="city"
                                value={formValues.city}
                                onChange={handleChange}
                                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                            />
                            {errors.city ? <p className="mt-1 text-xs text-red-600">{errors.city}</p> : null}
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-gray-800">Pincode</label>
                            <input
                                type="text"
                                name="pincode"
                                value={formValues.pincode}
                                onChange={handleChange}
                                maxLength={6}
                                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                            />
                            {errors.pincode ? <p className="mt-1 text-xs text-red-600">{errors.pincode}</p> : null}
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-gray-800">State / UT</label>
                            <select
                                name="state"
                                value={formValues.state}
                                onChange={handleChange}
                                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                            >
                                <option value="">Select state</option>
                                {ADDRESS_STATES.map((stateName) => (
                                    <option key={stateName} value={stateName}>{stateName}</option>
                                ))}
                            </select>
                            {errors.state ? <p className="mt-1 text-xs text-red-600">{errors.state}</p> : null}
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
                            checked={formValues.isDefault}
                            onChange={handleChange}
                            className="accent-amber-600"
                        />
                        Set as default address
                    </label>

                    {submitError ? (
                        <p className="mt-3 text-sm text-red-600">{submitError}</p>
                    ) : null}

                    <div className="mt-6 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-5 py-2 rounded-lg bg-gradient-to-r from-orange-600 to-amber-500 text-white text-sm font-semibold hover:shadow-md disabled:opacity-70 transition"
                        >
                            {isSaving ? 'Saving...' : submitLabel}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddressFormModal;
