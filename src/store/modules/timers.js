import timersApi from '@/store/api/timers'
import {
  isSameTaskId,
  getTaskTrackedMinutesForDate,
  isTimerVisibleForDate
} from '@/lib/timers'
import { populateTask } from '@/lib/models'
import { LOAD_TIMERS_END, RESET_ALL } from '@/store/mutation-types'

const initialState = {
  timers: [],
  currentQuery: {
    date: undefined,
    embedTask: true
  }
}

const isTimerTooShortError = error => {
  const message =
    error?.response?.body?.message ||
    error?.response?.message ||
    error?.body?.message ||
    error?.message

  return message === 'Timer too short'
}

const normalizeEmbeddedTask = task => {
  if (!task) {
    return task
  }

  const normalizedTask = { ...task }

  if (
    normalizedTask.full_entity_name === undefined &&
    normalizedTask.entity_name &&
    normalizedTask.entity_type_name
  ) {
    populateTask(normalizedTask)
  }

  if (
    normalizedTask.task_estimation === undefined &&
    normalizedTask.estimation !== undefined
  ) {
    normalizedTask.task_estimation = normalizedTask.estimation
  }

  if (
    normalizedTask.entity_preview_file_id === undefined &&
    normalizedTask.last_preview_file_id !== undefined
  ) {
    normalizedTask.entity_preview_file_id = normalizedTask.last_preview_file_id
  }

  return normalizedTask
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
      state.timers.filter(timer =>
        isTimerVisibleForDate(timer, date, timezone, now)
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
      try {
        await timersApi.endTimer()
      } catch (error) {
        if (!isTimerTooShortError(error)) {
          throw error
        }
      }
    }

    await timersApi.startTimer(taskId)
    return dispatch('loadTimers', state.currentQuery)
  },

  async endTimer({ dispatch, state }) {
    try {
      await timersApi.endTimer()
    } catch (error) {
      if (!isTimerTooShortError(error)) {
        throw error
      }
    }
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
    state.timers = timers.map(timer => ({
      ...timer,
      task: normalizeEmbeddedTask(timer.task)
    }))
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
