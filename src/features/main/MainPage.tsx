import { useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '@/components/Avatar'
import { DebitCardItem } from '@/components/DebitCardItem'
import { Loading } from '@/components/Loading'
import { MainAccountCard } from '@/components/MainAccountCard'
import { Notice } from '@/components/Notice'
import { RecentContacts } from '@/components/RecentContacts'
import { SecondaryAccountCard } from '@/components/SecondaryAccountCard'
import { t } from '@/i18n'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { selectMainAccountEntry, selectSecondaryEntries } from '@/store/selectors'
import {
  fetchAccounts,
  mainAccountSet,
  menuClosed,
  menuToggled,
} from '@/store/slices/accountsSlice'
import { signedOut } from '@/store/slices/authSlice'
import { fetchDashboard } from '@/store/slices/dashboardSlice'
import { useCoachMark } from './useCoachMark'
import { useCopyAccountNumber } from './useCopyAccountNumber'

export function MainPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const greeting = useAppSelector(state => state.user.profile?.greetingMessage)
  const accountsStatus = useAppSelector(state => state.accounts.status)
  const accountsError = useAppSelector(state => state.accounts.error)
  const accountCount = useAppSelector(state => state.accounts.items.length)
  const openMenuIndex = useAppSelector(state => state.accounts.openMenuIndex)
  const mainEntry = useAppSelector(selectMainAccountEntry)
  const secondary = useAppSelector(selectSecondaryEntries)
  const {
    recentTransactions,
    debitCards,
    banners,
    status: dashboardStatus,
    error: dashboardError,
  } = useAppSelector(state => state.dashboard)

  const { copy, message: copyMessage } = useCopyAccountNumber()
  const { showCoachMark, dismissCoachMark } = useCoachMark()

  const loadAccounts = useCallback(() => void dispatch(fetchAccounts()), [dispatch])
  const loadDashboard = useCallback(() => void dispatch(fetchDashboard()), [dispatch])

  /**
   * Loaded on every entry, not only when the store is empty. Signing out clears
   * the session but leaves the slices filled, so a `status === 'idle'` guard let
   * the next sign-in render the previous session's balances and account numbers
   * without asking the server anything.
   */
  useEffect(() => {
    loadAccounts()
    loadDashboard()
  }, [loadAccounts, loadDashboard])

  /**
   * A menu is dismissed by tapping anywhere else, as a native action sheet is —
   * but not by tapping inside it. The menu is hidden with `display: none`, so
   * closing it on pointerdown swallowed the click on its own buttons and left
   * every menu action unreachable.
   */
  useEffect(() => {
    if (openMenuIndex === null) return
    const close = (event: PointerEvent) => {
      if ((event.target as Element | null)?.closest('.tooltip')) return
      dispatch(menuClosed())
    }
    window.addEventListener('pointerdown', close)
    return () => window.removeEventListener('pointerdown', close)
  }, [dispatch, openMenuIndex])

  const toggleMenu = useCallback(
    (index: number) => (event: React.MouseEvent) => {
      // The document-level listener above would otherwise close it again at once.
      event.stopPropagation()
      dismissCoachMark()
      dispatch(menuToggled(index))
    },
    [dispatch, dismissCoachMark],
  )

  const signOut = useCallback(() => {
    dispatch(signedOut())
    navigate('/pin', { replace: true })
  }, [dispatch, navigate])

  /**
   * The accounts are the screen. Without them there is nothing to frame, so they
   * decide what the body shows; the dashboard lists degrade on their own below.
   */
  const renderBody = () => {
    if (accountsStatus === 'failed' && accountsError) {
      return <Notice message={accountsError} actionLabel={t('common.tryAgain')} onAction={loadAccounts} />
    }

    if (accountsStatus === 'idle' || accountsStatus === 'loading') {
      return <Loading label={t('main.loadingAccounts')} />
    }

    if (accountCount === 0) {
      return <Notice message={t('main.noAccounts')} />
    }

    return (
      <div className="content_wrap">
        {greeting && (
          <div className="main-top">
            <h1 className="main-top__tit main-loading main-loading--order1">{greeting}</h1>
          </div>
        )}

        {mainEntry && (
          <MainAccountCard
            account={mainEntry.account}
            isMenuOpen={openMenuIndex === mainEntry.index}
            onToggleMenu={toggleMenu(mainEntry.index)}
            onCopyAccountNumber={() => void copy(mainEntry.account.accountNumber)}
            showCoachMark={showCoachMark}
          />
        )}

        <RecentContacts contacts={recentTransactions} />

        {debitCards.length > 0 && (
          <div className="debit-swipe__wrap main-loading main-loading--order6">
            <div className="debit-swipe__inner">
              <div className="debit-swipe__lst">
                {debitCards.map((card, index) => (
                  <DebitCardItem key={`${card.name}-${index}`} card={card} />
                ))}
                <a href="#" className="debit-swipe__item debit-swipe__item--all">
                  {t('main.seeAll')}
                </a>
              </div>
            </div>
          </div>
        )}

        {/*
          The accounts arrived but these did not. Hiding the sections silently
          would read as "you have no cards"; this says what happened and offers
          the one retry that is needed.
        */}
        {dashboardStatus === 'failed' && dashboardError && (
          <Notice
            variant="inline"
            message={dashboardError}
            actionLabel={t('common.reload')}
            onAction={loadDashboard}
          />
        )}

        {secondary.map(({ account, index }) => (
          <SecondaryAccountCard
            key={index}
            account={account}
            isMenuOpen={openMenuIndex === index}
            onToggleMenu={toggleMenu(index)}
            onSetMainAccount={() => dispatch(mainAccountSet(index))}
            onCopyAccountNumber={() => void copy(account.accountNumber)}
          />
        ))}

        {banners.map(banner => (
          <a href="#" className="main-prod" key={banner.title}>
            <Avatar src={banner.image} className="main-prod__cms-ico" />
            <strong className="main-prod__tit">{banner.title}</strong>
            <p className="main-prod__dsc">{banner.description}</p>
          </a>
        ))}

        <div className="main-tb">
          <a href="#" className="link-to">
            {t('main.totalBalance')}
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="wrap">
      <header className="header">
        <a href="#" className="header__lft header__menu">
          <span className="blind">{t('main.menu')}</span>
        </a>
        <button type="button" className="header__rgt header__cxl" onClick={signOut}>
          <span className="blind">{t('main.cancel')}</span>
        </button>
      </header>

      <main className="container container--main">{renderBody()}</main>

      {copyMessage && (
        <div className="tooltip tooltip--bubble app-toast" style={{ display: 'block' }} role="status">
          <span className="tooltip__txt">{copyMessage}</span>
        </div>
      )}
    </div>
  )
}
