import {configureStore, ThunkAction, Action, AnyAction} from '@reduxjs/toolkit';
import gameReducer from '../features/game/gameSlice';
import walletReducer from '../features/wallet/walletSlice';

export const store = configureStore({
    reducer: {
        game: gameReducer,
        wallet: walletReducer,
    },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, AnyAction>
