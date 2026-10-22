import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '.'

/** Pre-typed hooks — components never re-declare the store's types. */
export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
