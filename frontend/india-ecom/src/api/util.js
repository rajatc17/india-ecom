import { api } from './client';

export const ADDRESS_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar',
    'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh',
    'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra',
    'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Andaman and Nicobar Islands', 'Chandigarh',
    'Dadra and Nagar Haveli and Daman and Diu', 'Delhi',
    'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

export const initialAddressForm = {
    label: 'Home',
    fullName: '',
    phone: '',
    line1: '',
    line2: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    isDefault: true,
    type: 'both',
};

export const sanitizeAddressPayload = (formValues) => ({
    label: formValues.label,
    fullName: formValues.fullName.trim(),
    phone: formValues.phone.trim(),
    line1: formValues.line1.trim(),
    line2: formValues.line2.trim(),
    landmark: formValues.landmark.trim(),
    city: formValues.city.trim(),
    state: formValues.state,
    pincode: formValues.pincode.trim(),
    country: 'India',
    isDefault: Boolean(formValues.isDefault),
    type: formValues.type,
});

export const formatAddressCityStatePincode = (address = {}) => (
    [address?.city, address?.state, address?.pincode].filter(Boolean).join(', ')
);

export const getAddressDisplayLines = (address = {}) => {
    const lines = [];

    if (address?.line1) {
        lines.push(address.line1);
    }

    if (address?.line2) {
        lines.push(address.line2);
    }

    const cityStatePincode = formatAddressCityStatePincode(address);
    if (cityStatePincode) {
        lines.push(cityStatePincode);
    }

    return lines;
};

export const validateAddress = (formValues) => {
    const errors = {};
    const phoneRegex = /^[6-9]\d{9}$/;
    const pincodeRegex = /^[1-9][0-9]{5}$/;

    if (!formValues.fullName.trim()) {
        errors.fullName = 'Full name is required';
    }

    if (!phoneRegex.test(formValues.phone.trim())) {
        errors.phone = 'Enter a valid 10-digit Indian mobile number';
    }

    if (!formValues.line1.trim()) {
        errors.line1 = 'Address line 1 is required';
    } else if (formValues.line1.trim().length > 200) {
        errors.line1 = 'Address line 1 must be at most 200 characters';
    }

    if (formValues.line2.trim().length > 200) {
        errors.line2 = 'Address line 2 must be at most 200 characters';
    }

    if (!formValues.city.trim()) {
        errors.city = 'City is required';
    }

    if (!ADDRESS_STATES.includes(formValues.state)) {
        errors.state = 'Please select a valid state/UT';
    }

    if (!pincodeRegex.test(formValues.pincode.trim())) {
        errors.pincode = 'Enter a valid 6-digit pincode';
    }

    if (!['Home', 'Work', 'Other'].includes(formValues.label)) {
        errors.label = 'Invalid label selected';
    }

    if (!['billing', 'shipping', 'both'].includes(formValues.type)) {
        errors.type = 'Invalid address type selected';
    }

    return errors;
};

export const checkEmailExists = async (email) => {
    try {
        const data = await api('/api/auth/check-email', {
            method: 'POST',
            body: JSON.stringify({ email })
        });
        return data.exists;
    } catch (error) {
        //console.error('Error checking email:', error);
        //return false;
        return Promise.reject(error);
    }
};