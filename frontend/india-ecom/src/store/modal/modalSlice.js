import { createSlice } from "@reduxjs/toolkit";

const ModalSlice = createSlice({
  name: "modal",
  initialState: {
    isLoginModalOpen: false,
  },
    reducers: {
    openLoginModal: (state) => {
      state.isLoginModalOpen = true;
    },
    closeLoginModal: (state) => {
      state.isLoginModalOpen = false;
    },
    }
});

export const { openLoginModal, closeLoginModal } = ModalSlice.actions;
export default ModalSlice.reducer;