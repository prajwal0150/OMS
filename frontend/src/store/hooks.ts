import { useDispatch, useSelector, useStore } from 'react-redux';
import type { AppDispatch, RootState, store } from '../store/store';

/** Typed hooks - use these instead of the untyped react-redux exports. */
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
export const useAppStore = useStore.withTypes<typeof store>();
