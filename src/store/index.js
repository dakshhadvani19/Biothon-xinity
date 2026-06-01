import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import diagnosticsReducer from './slices/diagnosticsSlice';
import feedReducer from './slices/feedSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    diagnostics: diagnosticsReducer,
    feed: feedReducer,
  },
});
