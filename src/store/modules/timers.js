import timersApi from '@/store/api/timers'
import {
  isSameTaskId,
  getTaskTrackedMinutesForDate,
  getTimerDateOverlapMinutes
} from '@/lib/timers'
import { LOAD_TIMERS_END, RESET_ALL } from '@/store/mutation-types'

const initialState = {
  timers: [],
  currentQuery: {
    date: undefined,
    embedTask: true
  }
}

const state = { ...initialState }

const getters = {
  timers: state => state.timers,
  currentTimer: state => state.timers.find(t => !t.end_time),
  isTaskTimerRunning: (state, getters) => taskId =>
    getters.currentTimer
      ? isSameTaskId(getters.currentTimer.task_id, taskId)
      : false,
  timersForDate:
    state =>
    ({ date, timezone, now } = {}) =>
      state.timers.filter(
        timer => getTimerDateOverlapMinutes(timer, date, timezone, now) > 0
      ),
  trackedTaskDurationForDate:
    state =>
    ({ taskId, date, timezone, manualDuration = 0, now }) =>
      getTaskTrackedMinutesForDate({
        taskId,
        timers: state.timers,
        date,
        timezone,
        manualDuration,
        now
      })
}

const actions = {
  async loadTimers({ commit }, { date, embedTask = true } = {}) {
    const timers = await timersApi.getTimers(date, embedTask)
    commit(LOAD_TIMERS_END, {
      timers,
      query: { date, embedTask }
    })
    return timers
  },

  async startTimer({ dispatch, getters, state }, taskId) {
    if (
      getters.currentTimer &&
      isSameTaskId(getters.currentTimer.task_id, taskId)
    ) {
      return getters.currentTimer
    }

    if (getters.currentTimer) {
      await timersApi.endTimer()
    }

    await timersApi.startTimer(taskId)
    return dispatch('loadTimers', state.currentQuery)
  },

  async endTimer({ dispatch, state }) {
    await timersApi.endTimer()
    return dispatch('loadTimers', state.currentQuery)
  },

  async discardTimer({ dispatch, state }) {
    await timersApi.discardTimer()
    return dispatch('loadTimers', state.currentQuery)
  },

  async updateTimer({ dispatch, state }, { timerId, data }) {
    await timersApi.updateTimer(timerId, data)
    return dispatch('loadTimers', state.currentQuery)
  },

  async deleteTimer({ dispatch, state }, timerId) {
    await timersApi.deleteTimer(timerId)
    return dispatch('loadTimers', state.currentQuery)
  }
}

const mutations = {
  [LOAD_TIMERS_END](state, { timers, query }) {
    state.timers = timers
    state.currentQuery = query || { ...initialState.currentQuery }
  },

  [RESET_ALL](state) {
    Object.assign(state, { ...initialState })
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
