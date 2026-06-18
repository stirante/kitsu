<template>
  <XyzTransition appear xyz="fade">
    <div class="main">
      <topbar />
      <sidebar />
      <router-view />

      <timezone-mismatch-modal
        v-if="showTimezoneMismatch"
        active
        :is-loading="isTimezoneSaving"
        :profile-timezone="profileTimezone"
        :browser-timezone="browserTimezone"
        @confirm="onTimezoneConfirm"
        @cancel="onTimezoneCancel"
      />
    </div>
  </XyzTransition>
</template>

<script>
import moment from 'moment-timezone'
import { mapGetters } from 'vuex'

import Topbar from '@/components/tops/Topbar.vue'
import Sidebar from '@/components/sides/Sidebar.vue'
import TimezoneMismatchModal from '@/components/modals/TimezoneMismatchModal.vue'

import localPreferences from '@/lib/preferences'
import { getBrowserTimezone, hasTimezoneMismatch } from '@/lib/timezone'
import peopleApi from '@/store/api/people'
import { USER_SAVE_PROFILE_SUCCESS } from '@/store/mutation-types'

export default {
  name: 'main-wrapper',

  components: {
    Topbar,
    Sidebar,
    TimezoneMismatchModal
  },

  data() {
    return {
      showTimezoneMismatch: false,
      isTimezoneSaving: false,
      timezonePromptHandled: false
    }
  },

  computed: {
    ...mapGetters(['user']),

    browserTimezone() {
      return getBrowserTimezone()
    },

    profileTimezone() {
      return this.user?.timezone || this.browserTimezone
    }
  },

  mounted() {
    this.$socket.connect()
    this.maybePromptTimezoneMismatch()
  },

  methods: {
    maybePromptTimezoneMismatch() {
      if (this.timezonePromptHandled || !this.user?.id) {
        return
      }
      if (localPreferences.getBoolPreference('timezone:ignore-mismatch')) {
        return
      }
      if (hasTimezoneMismatch()) {
        this.timezonePromptHandled = true
        this.showTimezoneMismatch = true
      }
    },

    async onTimezoneConfirm({ dontAskAgain }) {
      const timezone = this.browserTimezone
      this.isTimezoneSaving = true
      try {
        await peopleApi.updateTimezone(this.user.id, timezone)
        this.$store.commit(USER_SAVE_PROFILE_SUCCESS, { timezone })
        moment.tz.setDefault(timezone)
      } catch (err) {
        console.error('Failed to update timezone', err)
      } finally {
        this.isTimezoneSaving = false
      }
      if (dontAskAgain) {
        localPreferences.setPreference('timezone:ignore-mismatch', 'true')
      }
      this.showTimezoneMismatch = false
    },

    onTimezoneCancel(payload = {}) {
      if (payload.dontAskAgain) {
        localPreferences.setPreference('timezone:ignore-mismatch', 'true')
      }
      this.showTimezoneMismatch = false
    }
  }
}
</script>

<style>
.main {
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
