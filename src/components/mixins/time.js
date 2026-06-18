/*
 * Set of functions to facilitate usage of a date and timezones.
 */
import { mapGetters } from 'vuex'

import {
  formatFullDateWithTimezone,
  getCurrentDateForTimezone
} from '@/lib/time'
import { getUserTimezone } from '@/lib/timezone'

export const timeMixin = {
  computed: {
    ...mapGetters(['user']),

    timezone() {
      return getUserTimezone()
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
