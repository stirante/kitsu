import moment from 'moment-timezone'

import store from '@/store'
import peopleApi from '@/store/api/people'
import { USER_SAVE_PROFILE_SUCCESS } from '@/store/mutation-types'

/*
 * Timezone guessed from the browser settings. Used as a last resort only, when
 * the user has no timezone stored in the backend yet.
 */
export const getBrowserTimezone = () => moment.tz.guess()

/*
 * Canonical timezone for the current user. The backend is the single source of
 * truth: time spents and timers are bucketed per day using the timezone stored
 * on the person. The frontend must use the very same value, otherwise day
 * boundaries (and thus tracked durations) disagree between the two.
 */
export const getUserTimezone = () => {
  const user = store.state.user.user
  return user?.timezone || getBrowserTimezone()
}

/*
 * True when the browser timezone differs from the one stored in the backend in
 * a way that actually shifts day boundaries (different current UTC offset).
 */
export const hasTimezoneMismatch = () => {
  const user = store.state.user.user
  const browserTimezone = getBrowserTimezone()
  if (!user?.timezone || !browserTimezone) {
    return false
  }
  if (user.timezone === browserTimezone) {
    return false
  }
  return (
    moment.tz(user.timezone).utcOffset() !==
    moment.tz(browserTimezone).utcOffset()
  )
}

export default {
  /*
   * Configure moment libs with the timezone of the current user.
   */
  setTimezone() {
    moment.tz.setDefault(getUserTimezone())
  },

  /*
   * On first login the user has no timezone stored yet. Persist the timezone
   * guessed from the browser so the backend and the frontend share a single
   * source of truth from the very start.
   */
  async ensureUserTimezone() {
    const user = store.state.user.user
    if (!user || user.timezone) {
      return user?.timezone
    }
    const timezone = getBrowserTimezone()
    if (!timezone) {
      return null
    }
    try {
      await peopleApi.updateTimezone(user.id, timezone)
      store.commit(USER_SAVE_PROFILE_SUCCESS, { timezone })
      moment.tz.setDefault(timezone)
    } catch (err) {
      console.error('Failed to set timezone from browser', err)
      return null
    }
    return timezone
  }
}
