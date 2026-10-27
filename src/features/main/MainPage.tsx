import { useCallback, useEffect } from 'react'
import { flushSync } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '@/components/Avatar'
import { DebitCardItem } from '@/components/DebitCardItem'
import { InertLink } from '@/components/InertLink'
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

/** Only one menu is open at a time, so its trigger is the one marked expanded. */
const OPEN_MENU_TRIGGER = '[aria-expanded="true"][aria-controls]'

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
   * Loaded on every entry, not only when the store is empty. Signing out already
   * clears the slices; the refetch keeps the balances fresh on every visit.
   */
  useEffect(() => {
    loadAccounts()
    loadDashboard()
  }, [loadAccounts, loadDashboard])

  /** Closes the open menu from inside it, handing focus back to its trigger. */
  const closeMenu = useCallback(() => {
    document.querySelector<HTMLElement>(OPEN_MENU_TRIGGER)?.focus()
    dispatch(menuClosed())
  }, [dispatch])

  /**
   * A menu is dismissed by tapping anywhere else, as a native action sheet is —
   * but not by tapping inside it. The menu is hidden with `display: none`, so
   * closing it on pointerdown swallowed the click on its own buttons and left
   * every menu action unreachable. Nor by tapping its own trigger, whose click
   * would otherwise reopen what pointerdown had just closed. Opening one moves
   * focus to its first item and Escape closes it, so it works from the keyboard too.
   */
  useEffect(() => {
    if (openMenuIndex === null) return
    const trigger = document.querySelector<HTMLElement>(OPEN_MENU_TRIGGER)
    const menuId = trigger?.getAttribute('aria-controls')
    const menu = menuId ? document.getElementById(menuId) : null
    menu?.querySelector<HTMLElement>('button:not(:disabled)')?.focus()

    const close = (event: PointerEvent) => {
      const target = event.target as Element | null
      if (target?.closest('.tooltip') || (target && trigger?.contains(target))) return
      dispatch(menuClosed())
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.isComposing) return
      // Focus goes back only if it was in the menu; elsewhere it stays put.
      const focused = document.activeElement
      if (trigger?.contains(focused) || menu?.contains(focused)) trigger?.focus()
      dispatch(menuClosed())
    }
    window.addEventListener('pointerdown', close)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('pointerdown', close)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [dispatch, openMenuIndex])

  const toggleMenu = useCallback(
    (index: number) => () => {
      dismissCoachMark()
      dispatch(menuToggled(index))
    },
    [dispatch, dismissCoachMark],
  )

  const copyAndClose = (accountNumber: string) => {
    void copy(accountNumber)
    closeMenu()
  }

  /**
   * Cards are keyed by position, so the promoted card unmounts and takes focus
   * with it. Committing synchronously lets focus land on the new main card's trigger.
   */
  const setMainAccount = (index: number) => {
    flushSync(() => dispatch(mainAccountSet(index)))
    document.querySelector<HTMLElement>('.main-acc--large .main-acc__more')?.focus()
  }

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
            onCopyAccountNumber={() => copyAndClose(mainEntry.account.accountNumber)}
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
                <InertLink className="debit-swipe__item debit-swipe__item--all">
                  {t('main.seeAll')}
                </InertLink>
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
            onSetMainAccount={() => setMainAccount(index)}
            onCopyAccountNumber={() => copyAndClose(account.accountNumber)}
          />
        ))}

        {banners.map(banner => (
          <InertLink className="main-prod" key={banner.title}>
            <Avatar src={banner.image} className="main-prod__cms-ico" />
            <strong className="main-prod__tit">{banner.title}</strong>
            <p className="main-prod__dsc">{banner.description}</p>
          </InertLink>
        ))}

        <div className="main-tb">
          <InertLink className="link-to">
            {t('main.totalBalance')}
          </InertLink>
        </div>
      </div>
    )
  }

  return (
    <div className="wrap">
      <header className="header">
        <InertLink className="header__lft header__menu">
          <span className="blind">{t('main.menu')}</span>
        </InertLink>
        <button type="button" className="header__rgt header__cxl" onClick={signOut}>
          <span className="blind">{t('main.cancel')}</span>
        </button>
      </header>

      <main className="container container--main">{renderBody()}</main>

      {/* Always mounted: a live region added together with its text is often not read. */}
      <div className="blind" role="status">
        {copyMessage}
      </div>
      {copyMessage && (
        <div className="tooltip tooltip--bubble app-toast" style={{ display: 'block' }} aria-hidden="true">
          <span className="tooltip__txt">{copyMessage}</span>
        </div>
      )}
    </div>
  )
}
