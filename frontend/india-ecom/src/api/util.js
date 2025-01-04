import { api } from './client';

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