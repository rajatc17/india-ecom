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
            
            // Store token and update API client
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
            
            // Store token and update API client
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
        isAuthenticated: !!localStorage.getItem('token'),
        loading: false,
        error: null,
    },
    reducers: {
        logout: (state) => {
            state.currentUser = null;
            state.token = null;
            state.isAuthenticated = false;
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
            .addCase(registerUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(registerUser.fulfilled, (state, action) => {
                state.loading = false;
                state.currentUser = action.payload.user;
                state.token = action.payload.token;
                state.isAuthenticated = true;
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            
            // Login
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                state.currentUser = action.payload.user;
                state.token = action.payload.token;
                state.isAuthenticated = true;
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            
            // Fetch current user
            .addCase(fetchCurrentUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCurrentUser.fulfilled, (state, action) => {
                state.loading = false;
                state.currentUser = action.payload;
                state.isAuthenticated = true;
            })
            .addCase(fetchCurrentUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.isAuthenticated = false;
            })
            
            // Update profile
            .addCase(updateUserProfile.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateUserProfile.fulfilled, (state, action) => {
                state.loading = false;
                state.currentUser = action.payload;
            })
            .addCase(updateUserProfile.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
