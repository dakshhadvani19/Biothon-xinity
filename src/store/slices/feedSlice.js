import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  outbreaks: [],
  regionalThreatLevel: 'low',
};

export const feedSlice = createSlice({
  name: 'feed',
  initialState,
  reducers: {
    setOutbreaks: (state, action) => {
      state.outbreaks = action.payload;
    },
    setRegionalThreatLevel: (state, action) => {
      state.regionalThreatLevel = action.payload;
    }
  },
});

export const { setOutbreaks, setRegionalThreatLevel } = feedSlice.actions;
export default feedSlice.reducer;
