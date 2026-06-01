import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  imagePayload: null,
  status: 'idle', // 'idle' | 'compressing' | 'uploading' | 'success' | 'error'
};

export const diagnosticsSlice = createSlice({
  name: 'diagnostics',
  initialState,
  reducers: {
    setImagePayload: (state, action) => {
      state.imagePayload = action.payload;
    },
    setStatus: (state, action) => {
      state.status = action.payload;
    }
  },
});

export const { setImagePayload, setStatus } = diagnosticsSlice.actions;
export default diagnosticsSlice.reducer;
