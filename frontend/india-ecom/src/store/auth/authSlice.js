import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api, setToken } from "../../api/client";

export const registerUser = createAsyncThunk(
    'auth/register',
    async (userData, { rejectWithValue }) => {
        try {
            const data = await api('/api/auth/register', {
                method: 'POST',
                body: JSON.stringify(userData)
            });
            
            if (data.token) {
                setToken(data.token);
            }
            
            return data;
        } catch (error) {
            return rejectWithValue(error.message || 'Registration failed');
        }
    }
);

export const loginUser = createAsyncThunk(
    'auth/login',
    async (credentials, { rejectWithValue }) => {
        try {
            const data = await api('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify(credentials)
            });
            
            if (data.token) {
                setToken(data.token);
            }
            
            return data;
        } catch (error) {
            return rejectWithValue(error.message || 'Login failed');
        }
    }
);

export const fetchCurrentUser = createAsyncThunk(
    'auth/fetchCurrent',
    async (_, { rejectWithValue }) => {
        try {
            const data = await api('/api/users/me');
            return data;
        } catch (error) {
            return rejectWithValue(error.message || 'Failed to fetch user');
        }
    }
);

export const updateUserProfile = createAsyncThunk(
    'auth/updateProfile',
    async (updates, { rejectWithValue }) => {
        try {
            const data = await api('/api/users/me', {
                method: 'PUT',
                body: JSON.stringify(updates)
            });
            return data;
        } catch (error) {
            return rejectWithValue(error.message || 'Update failed');
        }
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        currentUser: null,
        token: localStorage.getItem('token') || null,
        isAuthenticated: false,
        loading: false,
        error: null,
        initialized: false,
    },
    reducers: {
        logout: (state) => {
            state.currentUser = null;
            state.token = null;
            state.isAuthenticated = false;
            state.initialized = true;
            state.error = null;
            localStorage.removeItem('token');
            setToken(null);
        },
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Register
            .addCase(registerUser.fulfilled, (state, action) => {
                state.loading = false;
                state.currentUser = action.payload.user;
                state.token = action.payload.token;
                state.isAuthenticated = true;
                state.initialized = true;
                localStorage.setItem('token', action.payload.token);
                setToken(action.payload.token);
            })
            // Login
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                state.currentUser = action.payload.user;
                state.token = action.payload.token;
                state.isAuthenticated = true;
                state.initialized = true;
                localStorage.setItem('token', action.payload.token);
                setToken(action.payload.token);
            })
            // Fetch current user
            .addCase(fetchCurrentUser.fulfilled, (state, action) => {
                state.loading = false;
                state.currentUser = action.payload;
                state.isAuthenticated = true;
                state.initialized = true;
            })
            .addCase(fetchCurrentUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.isAuthenticated = false;
                state.initialized = true;
                state.token = null;
                state.currentUser = null;
                localStorage.removeItem('token');
                setToken(null);
            });
    }
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
