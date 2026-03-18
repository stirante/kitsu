/*
 * Set of functions to facilitate usage of a date and timezones.
 */
import moment from 'moment-timezone'
import { mapGetters } from 'vuex'

import {
  formatFullDateWithTimezone,
  getCurrentDateForTimezone
} from '@/lib/time'

export const timeMixin = {
  computed: {
    ...mapGetters(['user']),

    timezone() {
      return this.user.timezone || moment.tz.guess()
    },

    today() {
      return getCurrentDateForTimezone(this.timezone)
    }
  },

  methods: {
    formatDate(eventDate) {
      return formatFullDateWithTimezone(eventDate, this.timezone)
    }
  }
}
