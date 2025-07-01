import timersApi from '@/store/api/timers'
import { LOAD_TIMERS_END, RESET_ALL } from '@/store/mutation-types'

const initialState = {
  timers: []
}

const state = { ...initialState }

const getters = {
  timers: state => state.timers,
  currentTimer: state => state.timers.find(t => !t.end_time)
}

const actions = {
  async loadTimers({ commit }, date = undefined, embedTask = true) {
    const timers = await timersApi.getTimers(date, embedTask)
    commit(LOAD_TIMERS_END, timers)
    return timers
  },

  async startTimer({ dispatch }, taskId) {
    await timersApi.startTimer(taskId)
    return dispatch('loadTimers')
  },

  async endTimer({ dispatch }) {
    await timersApi.endTimer()
    return dispatch('loadTimers')
  },

  async discardTimer({ dispatch }) {
    await timersApi.discardTimer()
    return dispatch('loadTimers')
  },

  async updateTimer({ dispatch }, { timerId, data }) {
    await timersApi.updateTimer(timerId, data)
    return dispatch('loadTimers')
  },

  async deleteTimer({ dispatch }, timerId) {
    await timersApi.deleteTimer(timerId)
    return dispatch('loadTimers')
  }
}

const mutations = {
  [LOAD_TIMERS_END](state, timers) {
    state.timers = timers
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
