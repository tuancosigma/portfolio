import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface ProjectState {
  projectName: string;
  isInitialized: boolean;
  counter: number;
}

const initialState: ProjectState = {
  projectName: 'Dự án mới',
  isInitialized: true,
  counter: 0,
};

export const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    setProjectName: (state, action: PayloadAction<string>) => {
      state.projectName = action.payload;
    },
    increment: (state) => {
      state.counter += 1;
    },
    decrement: (state) => {
      state.counter -= 1;
    },
    resetProject: () => {
      return { ...initialState };
    },
  },
});

export const { setProjectName, increment, decrement, resetProject } = projectSlice.actions;
export default projectSlice.reducer;
